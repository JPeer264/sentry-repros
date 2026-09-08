# B13 — Elysia on Bun with `@sentry/elysia`

Runtime: `bun` 1.4.0 · SDK: `develop` tarballs at 10.67.0 (`_toolbox/pack/*.tgz`) · Recorded verdict: **partial**

## What it reproduces

An Elysia 1.4 app on Bun, wrapped with `Sentry.withElysia()` from `@sentry/elysia`, driven by a plain
`node` process against a local envelope sink and a local echo server. It exercises four things at once:
route-named `http.server` segments (`GET /user/:id`, `http.route=/user/:id`, `source: route` in static
mode), error capture from a throwing handler (mechanism `auto.http.elysia.on_error`, `handled: false`),
outgoing `fetch` propagation from inside the handler (an `http.client` span plus `sentry-trace`/`baggage`
on the downstream request, sharing the server segment's `trace_id`), and the SDK name stamped on every
event. The first three work in both the default `stream` lifecycle and in `static`; the fourth is the
broken part — every event reports `sdk.name` as `sentry.javascript.bun` instead of
`sentry.javascript.elysia`, because `packages/elysia/src/sdk.ts` spreads `userOptions` into a new
`options` object *before* calling `applySdkMetadata(userOptions, 'elysia', ...)`, so the metadata lands
on an object that `initNode(options)` never sees.

## Install

```sh
cd $REPRO/probes/B13 && npm install --no-audit --no-fund
```

(`package.json` points at the mirrored develop tarballs in `../../_toolbox/pack/`.)

## Run

From this directory. Ports are arbitrary; pick free ones.

```sh
# stream lifecycle (the develop default)
PORT=45871 node sink.mjs > sink-stream.log 2>&1 & SP=$!
PORT=45872 node echo.mjs > echo-stream.log 2>&1 & EP=$!
sleep 1
SINK_PORT=45871 ECHO_PORT=45872 PORT=45873 bun app.ts > app-stream.log 2>&1 & AP=$!
sleep 3
node drive.mjs 45873 45871 > drive-stream.log 2>&1
kill $AP $EP $SP; wait $AP $EP $SP

# static lifecycle
PORT=45874 node sink.mjs > sink-static.log 2>&1 & SP=$!
PORT=45875 node echo.mjs > echo-static.log 2>&1 & EP=$!
sleep 1
TRACE_LIFECYCLE=static SINK_PORT=45874 ECHO_PORT=45875 PORT=45876 bun app.ts > app-static.log 2>&1 & AP=$!
sleep 3
node drive.mjs 45876 45874 > drive-static.log 2>&1
kill $AP $EP $SP; wait $AP $EP $SP
```

`drive.mjs` hits `/user/42`, then `/error`, then `/sentinel` (which calls
`Sentry.captureMessage('sentinel')`) and polls `/__items` until the sentinel event has arrived, so
everything sent before it is known to be in the sink. Results land in `drive-stream.log` and
`drive-static.log`.

Files: `instrument.ts` (Sentry init, imported first), `app.ts` (Elysia app), `sink.mjs` (envelope sink,
extended from `_toolbox/sink.mjs` with `sdkVersion`, `runtime`, `origin`, `httpRoute`, and per-span
`seg`/`src`/`route`/`status`/`trace`), `echo.mjs` (downstream server that echoes back the trace headers
it received), `drive.mjs` (plain-node driver).

## Expected

Recorded verdict: **partial**.

Route-named `http.server` segments, error capture with mechanism `auto.http.elysia.on_error`
`handled=false`, and outgoing fetch propagation from the handler all work in both lifecycles. Broken
part: `sdk.name` is reported as `sentry.javascript.bun` instead of `sentry.javascript.elysia` on every
event.

Recorded evidence lines:

```
stream (default) drive-stream-b.log:
  "echoed": { "url": "/downstream/42", "sentry-trace": "6aa3f2ef4eb848a090b7d0a02408b3da-9c254c2c71b5a1a3-1", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=6aa3f2ef4eb848a090b7d0a02408b3da,sentry-org_id=1,sentry-sampled=true,..." }
  { "type": "event", "exception": "elysia boom", "mechanism": "auto.http.elysia.on_error", "handled": false, "sdk": "sentry.javascript.bun", "sdkVersion": "10.67.0", "runtime": {"name":"bun","version":"1.4.0"}, "transaction": "GET /error", "trace_id": "e8720da5a71245c283625769199b128d", "hasContextLine": true }
  { "type": "span", "items": [ ..., "http.client GET 127.0.0.1 [seg=false ... trace=6aa3f2ef4eb848a090b7d0a02408b3da]", "handler /user/:id [seg=false src=- route=/user/:id status=ok ...]", ..., "http.server GET /user/:id [seg=true src=- route=/user/:id status=ok trace=6aa3f2ef4eb848a090b7d0a02408b3da]", "middleware AfterResponse ..." ] }
  { "type": "span", "items": [ ..., "handler /error [... route=/error status=ok ...]", "middleware sentryOnError ...", "middleware Error ...", "http.server GET /error [seg=true src=- route=/error status=error trace=e8720da5a71245c283625769199b128d]", ... ] }
static (TRACE_LIFECYCLE=static) drive-static-b.log:
  { "type": "transaction", "name": "GET /user/:id", "op": "http.server", "source": "route", "status": "ok", "origin": "auto.http.elysia", "trace_id": "7a13ce661ffc49899419b184e50c577f", "sdk": "sentry.javascript.bun", "httpRoute": "/user/:id", "spans": [ "middleware Request", "middleware sentryOnRequest", "middleware Parse", "middleware Transform", "middleware BeforeHandle", "handler Handle", "http.client GET http://127.0.0.1:42875/downstream/42", "middleware AfterHandle", "middleware sentryOnAfterHandle", "middleware MapResponse" ] }
  { "type": "transaction", "name": "GET /error", "op": "http.server", "source": "route", "status": "internal_error", "origin": "auto.http.elysia", "sdk": "sentry.javascript.bun", "httpRoute": "/error", "spans": [ ..., "handler Handle", "middleware Error", "middleware sentryOnError" ] }
  "echoed": { "sentry-trace": "7a13ce661ffc49899419b184e50c577f-957eb1266dad3240-1", "baggage": "...sentry-trace_id=7a13ce661ffc49899419b184e50c577f..." }  (matches transaction trace_id 7a13ce661ffc49899419b184e50c577f)
```

## Observed on 2026-09-07

Rebuilt and run once. **Matches the recorded verdict** — same `partial`: routes, errors and fetch
propagation work in both lifecycles, `sdk` is `sentry.javascript.bun` on every event.

stream (default), `drive-stream.log`:

```
 "body": {
  "id": "42",
  "echoed": {
   "url": "/downstream/42",
   "sentry-trace": "1ea46d085b774ecfb7fd6f23f064621a-b805b9f92ee4f114-1",
   "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=1ea46d085b774ecfb7fd6f23f064621a,sentry-sampled=true,sentry-sample_rand=0.18559691974186587,sentry-sample_rate=1"
  }
 }
{"type":"event","exception":"elysia boom","mechanism":"auto.http.elysia.on_error","handled":false,"sdk":"sentry.javascript.bun","sdkVersion":"10.67.0","runtime":{"name":"bun","version":"1.4.0"},"transaction":"GET /error","trace_id":"16028f7e1ed04e1ebee57fa370a3fbe2","hasContextLine":true}
{"type":"span","items":["middleware sentryOnRequest [...]","middleware Request [...]","middleware Parse [...]","middleware Transform [...]","middleware BeforeHandle [...]","http.client GET 127.0.0.1 [seg=false src=- route=- status=ok trace=1ea46d085b774ecfb7fd6f23f064621a]","handler /user/:id [seg=false src=- route=/user/:id status=ok trace=1ea46d085b774ecfb7fd6f23f064621a]","middleware sentryOnAfterHandle [...]","middleware AfterHandle [...]","middleware MapResponse [...]","http.server GET /user/:id [seg=true src=- route=/user/:id status=ok trace=1ea46d085b774ecfb7fd6f23f064621a]","middleware AfterResponse [...]"]}
{"type":"span","items":[...,"handler /error [seg=false src=- route=/error status=ok trace=16028f7e1ed04e1ebee57fa370a3fbe2]","middleware sentryOnError [...]","middleware Error [...]","http.server GET /error [seg=true src=- route=/error status=error trace=16028f7e1ed04e1ebee57fa370a3fbe2]","middleware AfterResponse [...]"]}
```

static (`TRACE_LIFECYCLE=static`), `drive-static.log`:

```
{"type":"transaction","name":"GET /user/:id","op":"http.server","source":"route","status":"ok","origin":"auto.http.elysia","trace_id":"dd62a0e4db794c3e92d0c1fb55ae7b0d","sdk":"sentry.javascript.bun","httpRoute":"/user/:id","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","http.client GET http://127.0.0.1:45875/downstream/42","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"]}
{"type":"event","exception":"elysia boom","mechanism":"auto.http.elysia.on_error","handled":false,"sdk":"sentry.javascript.bun","sdkVersion":"10.67.0","runtime":{"name":"bun","version":"1.4.0"},"transaction":"GET /error","trace_id":"fcb040a399b1439b843231fced017c57","hasContextLine":true}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","origin":"auto.http.elysia","trace_id":"fcb040a399b1439b843231fced017c57","sdk":"sentry.javascript.bun","httpRoute":"/error","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","middleware Error","middleware sentryOnError"]}
  "echoed": { "sentry-trace": "dd62a0e4db794c3e92d0c1fb55ae7b0d-aee2f3e842e9b015-1", "baggage": "...sentry-trace_id=dd62a0e4db794c3e92d0c1fb55ae7b0d..." }   (matches transaction trace_id dd62a0e4db794c3e92d0c1fb55ae7b0d)
```

Only cosmetic differences from the record: fresh trace ids and ports, and the baggage carries no
`sentry-org_id` this time (the recorded stream line had one; the DSN here has no org id). The recorded
note about response headers also holds: `/user/:id` returns `sentry-trace` and `baggage`
(`sentry-transaction=GET%20%2Fuser%2F%3Aid`) on the HTTP response, `/error` returns neither.
