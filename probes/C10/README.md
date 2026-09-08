# C10 - Cloudflare Pages with sentryPagesPlugin

Runtime: cloudflare (wrangler 4.129.0 / workerd local, `wrangler pages dev`) | SDK:
`@sentry/cloudflare` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A Cloudflare Pages project whose root `functions/_middleware.js` exports
`Sentry.sentryPagesPlugin(...)`, plus three Pages functions (`/api/hello` returns 200, `/api/error`
throws `Error("C10 pages function error")`, `/api/sentinel` calls `captureMessage('sentinel')`) and
two static assets (`index.html`, `app.js`). Driving `/`, `/app.js`, `/api/hello`, `/api/error` and
`/api/sentinel` shows what the plugin emits on the develop line: which requests get a span, how those
spans are named, and what the throwing request's span looks like. Two follow-up runs against the same
warm isolate (two `/api/error` requests, then a repeated `/api/sentinel`) show the isolate-level
client cache interacting with the default Dedupe integration.

## Install

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  wrangler@4
```

Run it from this directory.

## Run

From this directory (`.dev.vars` supplies `SINK_PORT=41537`, which the middleware turns into the
`tunnel` option):

```
PORT=41537 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
npx wrangler pages dev . --port 41637 --inspector-port 0 \
  --compatibility-flags nodejs_compat --compatibility-date 2026-05-01 > app.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:41637" app.log && break; sleep 1; done
node drive.mjs 41637 41537 > drive.log 2>&1; cat drive.log
curl -s "http://127.0.0.1:41537/__items?raw" > raw.json     # full payloads, for span attributes

# dedupe repro: two identical errors, then the sentinel
curl -s -X DELETE http://127.0.0.1:41537/__items
curl -s http://127.0.0.1:41637/api/error
curl -s http://127.0.0.1:41637/api/error
curl -s http://127.0.0.1:41637/api/sentinel
sleep 6; curl -s http://127.0.0.1:41537/__items

# the same captureMessage text from a later, separate request
curl -s -X DELETE http://127.0.0.1:41537/__items
curl -s http://127.0.0.1:41637/api/sentinel
sleep 6; curl -s http://127.0.0.1:41537/__items
grep -n "duplicate\|Captured error event" app.log

kill $apid; kill $spid
```

`drive.mjs` hits the five paths and then polls `/__items` until the `sentinel` event is there, so
everything sent before it has arrived. `sink.mjs` is the unmodified `_toolbox/qs/sink.mjs`.

## Expected

Recorded verdict: **partial**.

`sentryPagesPlugin` boots under `wrangler pages dev`: the thrown function error arrives as an
unhandled `auto.http.cloudflare` event and every request, including the static assets `/` and
`/app.js`, produces an `http.server` span envelope (stream lifecycle) named `GET /` for the root and
just `GET` for every other path (`url.path` carried as an attribute, source `url`). Two regressions
vs 10.73.0: (1) the client is cached in the isolate (`clientCache.js`,
`__SENTRY_CLOUDFLARE_CLIENT__`) so the Dedupe integration's state survives across requests, and
identical events from separate requests are dropped: two consecutive `GET /api/error` requests yield
ONE error event, and a repeated `captureMessage('sentinel')` from separate requests is dropped with
`Event dropped due to being a duplicate of previously captured event.` until a different event
intervenes; (2) the span for the throwing request ends with `status: ok` and no
`http.response.status_code`. Also `attachStacktrace` now defaults to true (core client.js:92) so
message events carry an `exception` value with a synthetic stack.

Recorded evidence lines:

```
drive (/, /app.js, /api/hello, /api/error, /api/sentinel):
{"type":"span","items":["http.server GET /"]}
{"type":"span","items":["http.server GET"]}
{"type":"span","items":["http.server GET"]}
{"type":"event","exception":"C10 pages function error","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":{"name":"cloudflare"},"hasContextLine":false}
{"type":"span","items":["http.server GET"]}
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare",...}
{"type":"span","items":["http.server GET"]}
raw span attrs: SPAN GET {"sentry.op":"http.server","http.request.method":"GET","url.full":"http://127.0.0.1:41637/app.js","url.path":"/app.js","http.response.status_code":200}
raw span status: GET status= ok path= /api/error code= None source= url

error x2 then sentinel (only ONE error event):
{"type":"event","exception":"C10 pages function error","mechanism":"auto.http.cloudflare","handled":false,...}
{"type":"span","items":["http.server GET"]}
{"type":"span","items":["http.server GET"]}
{"type":"event","message":"sentinel","exception":"sentinel",...}
{"type":"span","items":["http.server GET"]}

sentinel alone, second request (event missing):
[{"type":"span","items":["http.server GET"]}]

app.log with debug: true:
Sentry Logger [log]: Captured error event `sentinel`
Sentry Logger [warn]: Event dropped due to being a duplicate of previously captured event.
```

Recorded side notes kept for context: the root `functions/_middleware.js` wraps every request, so
plain static files get a span too and users who only want function spans have to scope the middleware
(e.g. `functions/api/_middleware.js`); the naming follows `wrapRequestHandlerWithInit.js`, where the
name is the raw name when the source is `route` or streaming is off and the bare method otherwise;
and the client cache regression likely affects `withSentry` Workers too, not only Pages.

## Observed on 2026-09-07

Matches the recorded verdict (**partial**), every element of it. Full output in `drive.log`,
`raw.json`, `dedupe.log` and `sentinel-again.log`; trimmed:

```
drive (/, /app.js, /api/hello, /api/error, /api/sentinel) -> 200 200 200 500 200:
{"type":"span","trace_id":"102abd04cb4f425fbc27917a4d39ec71","items":["http.server GET /"],"raw":[{"name":"GET /","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","trace_id":"97e296ac04cd431080acac68a9afcf75","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","trace_id":"88f46da2a6ac408fa50925f36ec97d23","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"event","exception":"Error: C10 pages function error","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"trace_id":"59931f6e60dd4df88807f73510e919c8","request":{"url":"http://127.0.0.1:41637/api/error","method":"GET"},"environment":"production"}
{"type":"span","trace_id":"59931f6e60dd4df88807f73510e919c8","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"577a6113c040460c848f874a3d0b47bb"}
{"type":"span","trace_id":"577a6113c040460c848f874a3d0b47bb","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}

raw span attrs (all five requests):
SPAN GET / {"sentry.op": "http.server", "http.request.method": "GET", "url.full": "http://127.0.0.1:41637/", "url.path": "/", "http.response.status_code": 200}
   status= ok path= / code= 200 source= route
SPAN GET {"sentry.op": "http.server", "http.request.method": "GET", "url.full": "http://127.0.0.1:41637/app.js", "url.path": "/app.js", "http.response.status_code": 200}
   status= ok path= /app.js code= 200 source= url
SPAN GET {"sentry.op": "http.server", "http.request.method": "GET", "url.full": "http://127.0.0.1:41637/api/hello", "url.path": "/api/hello", "http.response.status_code": 200}
   status= ok path= /api/hello code= 200 source= url
SPAN GET {"sentry.op": "http.server", "http.request.method": "GET", "url.full": "http://127.0.0.1:41637/api/error", "url.path": "/api/error"}
   status= ok path= /api/error code= None source= url
SPAN GET {"sentry.op": "http.server", "http.request.method": "GET", "url.full": "http://127.0.0.1:41637/api/sentinel", "url.path": "/api/sentinel", "http.response.status_code": 200}
   status= ok path= /api/sentinel code= 200 source= url

error x2 then sentinel (only ONE error event, dedupe.log):
{"type": "event", "exception": "Error: C10 pages function error", "mechanism": "auto.http.cloudflare", "handled": false, ...}
{"type": "span", "trace_id": "fdb15b8a31c04cee94484766abd13517", "items": ["http.server GET"], ...}
{"type": "span", "trace_id": "7cd95664ae7748cdbc98ad7f332b543c", "items": ["http.server GET"], ...}
{"type": "event", "message": "sentinel", "exception": "undefined: sentinel", "mechanism": "generic", "handled": true, ...}
{"type": "span", "trace_id": "38fc8e68d9874ac29ebc2d60f4ae6cad", "items": ["http.server GET"], ...}

sentinel alone, second request (event missing, sentinel-again.log):
[{"type":"span","trace_id":"d317dd53800c48368dde6b61bfb2d642","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}]

app.log with debug: true:
 85:Sentry Logger [log]: Captured error event `C10 pages function error`
105:Sentry Logger [log]: Captured error event `C10 pages function error`
106:Sentry Logger [warn]: Event dropped due to being a duplicate of previously captured event.
138:Sentry Logger [log]: Captured error event `sentinel`
139:Sentry Logger [warn]: Event dropped due to being a duplicate of previously captured event.
```

Every recorded element reproduced: the plugin boots, the function error arrives as an unhandled
`auto.http.cloudflare` event, all five requests including the two static assets produce
`http.server` span envelopes, `/` keeps its path (`GET /`, source `route`) while every other path is
method-only (`GET`, source `url`) with `url.path` as an attribute, the throwing request's span ends
`status: ok` with no `http.response.status_code`, two identical errors from separate requests yield
one event, the repeated `captureMessage('sentinel')` is dropped as a duplicate, and the message event
carries an `exception` value from the now-default `attachStacktrace`.

Differences, none of them behavioural: ids and trace ids are per-run; this run kept `debug: true` in
the middleware for the whole session, so the `Captured error event` / duplicate lines come from the
same `app.log` as the drive rather than a second run; and the stock sink renders the message event's
exception as `"undefined: sentinel"` (type is absent on a synthetic stacktrace) where the record
trimmed it to `"sentinel"`.

## Files

- `functions/_middleware.js` - the root middleware, `Sentry.sentryPagesPlugin(context => ({...}))`
- `functions/api/hello.js`, `functions/api/error.js`, `functions/api/sentinel.js` - the three functions
- `index.html`, `app.js` - static assets, to show that they get a span too
- `.dev.vars` - `SINK_PORT=41537`, read by the middleware for the `tunnel` option
- `sink.mjs` - unmodified `_toolbox/qs/sink.mjs`
- `drive.mjs` - hits the five paths, waits for the `sentinel` event, prints `/__items`
- `drive.log`, `raw.json`, `dedupe.log`, `sentinel-again.log` - sink output from the run above
- `app.log`, `sink.log` - wrangler (with SDK debug logs) and sink output from the run above
