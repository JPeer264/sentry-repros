# C01 - Handler errors and enrichment on Workers

Runtime: Cloudflare Workers (`wrangler dev` 4.x / workerd 1.20260903.1) | SDK: `@sentry/cloudflare`
10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A Worker wrapped in `withSentry` (`sendDefaultPii: true`, `tracesSampleRate: 1`, release
`c01-release@1.0.0`, environment `c01-env`, `tunnel` from the `SINK_URL` var) exposes four routes.
`/enriched-throw` sets a user, a tag, a custom context and a manual breadcrumb, writes a
`console.log` and a `console.warn`, then throws `Error("c01 handler boom")` straight out of the
`fetch` handler; `/waituntil-throw` and `/waituntil-reject` hand a throwing async function and a
rejected promise to `ctx.waitUntil` and answer 200; `/sentinel?n=1` captures a message used as the
sink sentinel. The probe checks three things at once: that a thrown handler error arrives fully
enriched (user with `ip_address`, tags, custom context, manual + console breadcrumbs, request data,
`contexts.runtime`, `cloud_resource`, `culture`, trace) and is rethrown so wrangler answers 500;
that errors inside `ctx.waitUntil` reach Sentry at all; and what status the streamed `http.server`
span for the throwing request carries.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  wrangler@4
```

## Run

From this directory:

```
PORT=44872 RAW=$PWD/raw.log node sink.mjs > sink.log 2>&1 & spid=$!
npx wrangler dev --port 44871 --inspector-port 0 --var SINK_URL:http://127.0.0.1:44872/ > app.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:44871" app.log && break; sleep 1; done
bash drive.sh 44871 44872 > drive.out 2>&1
curl -s http://127.0.0.1:44872/__items > items.json
kill $spid; kill $apid
```

`drive.sh` clears the sink, curls `/enriched-throw?q=1` (with `x-c01-header` and `cookie: c01=1`),
`/waituntil-throw`, `/waituntil-reject`, `/sentinel?n=1`, then polls the sink until `sentinel 1` is
there. `sink.mjs` is `_toolbox/qs/sink.mjs` with the event mapping extended to keep `user`, `tags`,
all `contexts`, `breadcrumbs`, `request` (header keys, `query_string`, `cookies`), frame count and
last frame; `RAW=<file>` also appends every raw envelope item.

## Expected

Recorded verdict: **partial**.

A thrown handler error is captured with full enrichment: user (plus `ip_address` from
`sendDefaultPii`), tags, custom context, manual + console breadcrumbs, request (url, method,
headers, query_string, cookies), `contexts.runtime {name: cloudflare}`, `cloud_resource`, `culture`,
trace context; `withSentry` rethrows and wrangler answers 500. NOT working: errors thrown or
rejected inside `ctx.waitUntil(promise)` are never captured (workerd logs `Uncaught Error`, the sink
receives nothing before the sentinel), and the `http.server` span for the throwing request is
streamed with status `ok` and no `http.response.status_code`, because
`wrapRequestHandlerWithInit` calls `span.end()` in its catch without setting an error status.

Recorded evidence lines:

```
drive2.out: GET /enriched-throw -> 'HTTP/1.1 500' body 'Error: c01 handler boom at Object.fetch (.../develop/src/index.ts:22:15) at null.<anonymous> (.../@sentry/cloudflare/src/instrumentations/worker/instrumentFetch.ts:41:89)'; /waituntil-throw and /waituntil-reject -> 'HTTP/1.1 200 OK'
items2.json event: "exception":"c01 handler boom","exType":"Error","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","sdkVersion":"10.67.0","level":"error"
 "user":{"id":"user-42","email":"c01@example.com","username":"c01user","ip_address":"127.0.0.1"}
 "tags":{"c01_tag":"tag-value"}
 "contexts":{"trace":{...},"cloud_resource":{"cloud.provider":"cloudflare"},"culture":{"timezone":"Europe/Vienna"},"c01_context":{"key":"ctx-value","n":7},"runtime":{"name":"cloudflare"}}
 "breadcrumbs":[{"category":"c01","message":"manual breadcrumb","level":"info","data":{"step":1}},{"category":"console","message":"console.log before throw [object Object]","level":"log","data":{"arguments":["console.log before throw",{"route":"/enriched-throw"}],"logger":"console"}},{"category":"console","message":"console.warn before throw","level":"warning"}]
 "request":{"url":"http://127.0.0.1:41871/enriched-throw?q=1","method":"GET","hasHeaders":true,"headerKeys":["accept","accept-encoding","cf-connecting-ip","cookie","host","user-agent","x-c01-header"],"query_string":"q=1","cookies":{"c01":"1"}}
 "frameCount":10, last frame {"filename":".../C01/develop/.wrangler/tmp/dev-KBMDvc/index.js","function":"Object.fetch","lineno":14257,"colno":15,"in_app":true}, "hasContextLine":false
sink items in order: event(c01 handler boom), span["http.server GET"], span["http.server GET"], span["http.server GET"], event(sentinel 1), span["http.server GET"]  -> no event for 'c01 waitUntil boom' or 'c01 waitUntil reject'; grep -c 'waitUntil boom\|waitUntil reject' raw2.log = 0
raw2.log span for /enriched-throw: "name":"GET","is_segment":true,"status":"ok", attributes url.path=/enriched-throw, NO http.response.status_code (the 200 routes have it)
app2.log: '[wrangler:error] Error: c01 handler boom', 'GET /enriched-throw 500 Internal Server Error', '[ERROR] Uncaught Error: c01 waitUntil boom', '[ERROR] Uncaught Error: c01 waitUntil reject', 'GET /waituntil-throw 200 OK'
```

## Observed on 2026-09-07

Matches the recorded verdict (**partial**), field for field. Verbatim trimmed output of the run
above (`drive.out`, `items.json`, `raw.log`, `app.log` in this directory):

```
drive.out: GET /enriched-throw?q=1 -> 'HTTP/1.1 500' body
  'Error: c01 handler boom
     at Object.fetch (file:///.../probes/C01/src/index.ts:22:15)
     at null.<anonymous> (file:///.../probes/C01/node_modules/@sentry/cloudflare/src/instrumentations/worker/instrumentFetch.ts:41:89)'
  /waituntil-throw -> 'HTTP/1.1 200 OK', /waituntil-reject -> 'HTTP/1.1 200 OK', /sentinel?n=1 -> 'HTTP/1.1 200 OK'
items.json event:
 {"exception": "c01 handler boom"} {"exType": "Error"} {"mechanism": "auto.http.cloudflare"} {"handled": false}
 {"sdk": "sentry.javascript.cloudflare"} {"sdkVersion": "10.67.0"} {"level": "error"}
 {"release": "c01-release@1.0.0"} {"environment": "c01-env"}
 {"user": {"id": "user-42", "email": "c01@example.com", "username": "c01user", "ip_address": "127.0.0.1"}}
 {"tags": {"c01_tag": "tag-value"}}
 {"contexts": {"trace": {"span_id": "8dca6f6c47b231f9", "trace_id": "eca94ba01c8f4dd2a08c1c0ee40cde39"}, "cloud_resource": {"cloud.provider": "cloudflare"}, "culture": {"timezone": "Europe/Vienna"}, "c01_context": {"key": "ctx-value", "n": 7}, "runtime": {"name": "cloudflare"}}}
 {"breadcrumbs": [{"category": "c01", "message": "manual breadcrumb", "level": "info", "data": {"step": 1}}, {"category": "console", "message": "console.log before throw [object Object]", "level": "log", "data": {"arguments": ["console.log before throw", {"route": "/enriched-throw"}], "logger": "console"}}, {"category": "console", "message": "console.warn before throw", "level": "warning", "data": {"arguments": ["console.warn before throw"], "logger": "console"}}]}
 {"request": {"url": "http://127.0.0.1:44871/enriched-throw?q=1", "method": "GET", "hasHeaders": true, "headerKeys": ["accept", "accept-encoding", "cf-connecting-ip", "cookie", "host", "user-agent", "x-c01-header"], "query_string": "q=1", "cookies": {"c01": "1"}}}
 {"frameCount": 10}
 {"lastFrame": {"filename": "$REPRO/probes/C01/.wrangler/tmp/dev-Wyy1y4/index.js", "function": "Object.fetch", "lineno": 14252, "colno": 15, "in_app": true}}
 {"hasContextLine": false}
sink items in order: event(c01 handler boom), span['http.server GET'], span['http.server GET'], span['http.server GET'], event(sentinel 1), span['http.server GET']
grep -c 'waitUntil boom\|waitUntil reject' raw.log = 0
raw.log spans:
 {"name": "GET", "status": "ok", "is_segment": true, "url.path": "/enriched-throw", "http.response.status_code": null}
 {"name": "GET", "status": "ok", "is_segment": true, "url.path": "/waituntil-throw", "http.response.status_code": 200}
 {"name": "GET", "status": "ok", "is_segment": true, "url.path": "/waituntil-reject", "http.response.status_code": 200}
 {"name": "GET", "status": "ok", "is_segment": true, "url.path": "/sentinel", "http.response.status_code": 200}
app.log:
 [wrangler:error] Error: c01 handler boom
 [wrangler:info] GET /enriched-throw 500 Internal Server Error (54ms)
 [ERROR] Uncaught Error: c01 waitUntil boom
 [wrangler:info] GET /waituntil-throw 200 OK (3ms)
 [ERROR] Uncaught Error: c01 waitUntil reject
 [wrangler:info] GET /waituntil-reject 200 OK (1ms)
```

Both defects reproduce: nothing is sent for either `ctx.waitUntil` failure (0 raw envelope hits,
and the sentinel that follows them did arrive, so this is absence and not a timing artifact), and
the `http.server` span for `/enriched-throw` is `status: "ok"` with no `http.response.status_code`
while the three 200 routes carry one. The enrichment side is complete and identical to the record,
including the throw site `src/index.ts:22:15` in `Object.fetch` and `frameCount: 10`. Differences
from the record are cosmetic only: ports (44871/44872 instead of 41871/41872), the file paths in
the stack (this directory instead of the scratchpad `deep/C01/develop/`), the `.wrangler/tmp/dev-*`
bundle name and its line number (14252 vs the recorded 14257, the bundle differs slightly because
the source file was retyped), and the run's own trace/span ids. The record's second run also
mentioned a workerd `NOSENTRY reporting trace with exceptions, but no exception outcome` warning;
this wrangler prints the `Uncaught Error` lines twice instead and no such warning, which does not
change the verdict.

## Files

- `src/index.ts` - the Worker (line numbers matter: the throw is at 22:15 in the evidence)
- `wrangler.jsonc` - `compatibility_date: 2026-05-01`, `compatibility_flags: ["nodejs_compat"]`
- `sink.mjs` - extended envelope sink
- `drive.sh` - request driver plus sentinel poll
- `drive.out`, `items.json`, `raw.log`, `app.log`, `sink.log` - output of the run above
