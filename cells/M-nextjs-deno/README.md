# M-nextjs-deno

## What it reproduces

Next.js 15.5.4 (App Router, route handlers only) with `@sentry/nextjs` 10.67.0 (the `develop` / v11 line,
built from `getsentry/sentry-javascript@6f2da7483d`) running on Deno 2.9.0 via
`deno run -A node_modules/next/dist/bin/next build|start`. The app exercises seven server-side
capabilities against an envelope sink and a local fetch recorder: unhandled errors in a route handler,
parameterized route names, isolation-scope separation across concurrent requests, incoming
`sentry-trace` continuation, outgoing `fetch` instrumentation, database spans from module-scope `mysql2`
and `mysql@2` connections, and `Sentry.logger` log envelopes. The headline is the wiring, not the
capabilities: the SDK as shipped bricks the app on Deno. `Sentry.init()` in `@sentry/node` calls
`registerDiagnosticsChannelInjection()` unconditionally, which on Deno installs
`Module.registerHooks({resolve, load})`; with those hooks in place every `require()` of a `.json` file
throws `SyntaxError: Unexpected token ':'` (denoland/deno#36240), and Next.js `require()`s its build
manifests as JSON on every request, so every route 500s. The one option that fixes it,
`enableRuntimeChannelInjection: false`, is undocumented. Two further deviations from a docs page:
`withSentryConfig` lives on the CJS-only `@sentry/nextjs/config` subpath, whose named export Deno's CJS
detection cannot see (default interop required), and a CJS `next.config.js` is not an option because
Deno loads the root config as ESM.

## Install

```
cd $REPRO/cells/M-nextjs-deno
npm install --no-audit --no-fund
```

`package.json` pins every `@sentry/*` package to the 10.67.0 tarball in `../../_toolbox/pack/` (the
durable mirror of `$REPRO/_toolbox/pack`), so one `npm install` restores the whole tree. Use `npm`, not `deno install`:
`deno.json` sets `nodeModulesDir: "manual"`, which means Deno consumes a `node_modules` that npm prepared.

## Run

```
D=$REPRO/cells/M-nextjs-deno
cd $D

# sink + fetch recorder
PORT=41208 node sink.mjs     > sink.log     2>&1 &  SINK_PID=$!
PORT=41209 node recorder.mjs > recorder.log 2>&1 &  REC_PID=$!

deno run -A node_modules/next/dist/bin/next build > build.log 2>&1

SENTRY_TUNNEL=http://127.0.0.1:41208/ SENTRY_LIFECYCLE=static SENTRY_DEBUG=1 \
  deno run -A node_modules/next/dist/bin/next start -p 52847 > server-static.log 2>&1 &  APP_PID=$!

B=http://127.0.0.1:52847
curl -s -X DELETE http://127.0.0.1:41208/__items
curl -s $B/api/hello                        # baseline route
curl -s $B/api/error                        # errors
curl -s $B/users/42                         # route name
curl -s $B/api/db                           # db spans, mysql2, native channels
curl -s $B/api/db1                          # db spans, mysql@2, needs injection
curl -s $B/api/log                          # logs
curl -s "$B/api/fetch?target=http://127.0.0.1:41209/rec"   # outgoing fetch
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
        -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=abc123,sentry-sample_rate=1' \
        $B/api/hello                        # incoming trace
curl -s "$B/api/iso?tag=alpha" & curl -s "$B/api/iso?tag=bravo" & curl -s "$B/api/iso?tag=charlie" & wait
curl -s "$B/api/sentinel?n=1"               # sentinel: captureMessage + flush, wait for it in the sink

curl -s http://127.0.0.1:41208/__items | python3 -m json.tool
curl -s http://127.0.0.1:41209/__hits  | python3 -m json.tool

# stream lifecycle variant
SENTRY_LIFECYCLE=stream ... deno run -A node_modules/next/dist/bin/next start -p 52849

# reproduce the crash: PROBE_INJECTION_ON=1 restores the default docs wiring
# (enableRuntimeChannelInjection left at its default), no rebuild needed
PROBE_INJECTION_ON=1 SENTRY_TUNNEL=http://127.0.0.1:41208/ SENTRY_LIFECYCLE=static SENTRY_DEBUG=1 \
  deno run -A node_modules/next/dist/bin/next start -p 52848 > server-injection-on.log 2>&1 &

kill $APP_PID; kill $SINK_PID; kill $REC_PID
```

## Expected

Recorded verdicts (record id `M-nextjs-deno` in `_records/cells.json`):

| capability | recorded verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** - no `http.client` span, no `sentry-trace`/`baggage` on the wire (Deno K2) |
| db spans | **partial** - `mysql2` spans arrive via mysql2's own tracing channels; `mysql@2` produces none |
| logs | works |
| client errors | not-run (server runtime only) |

Recorded evidence lines:

```
--- A. Default docs wiring (no `enableRuntimeChannelInjection: false`): every request 500s ---
server1.log:7    Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
server1.log:119  Sentry Logger [warn]: [instrumentation] failed to inject diagnostics-channel into mysql2: [TypeError: transform is not a function]
server1.log:120-131
  Sentry Logger [log]: Http.Server Handling incoming request
  Sentry Logger [log]: [Tracing] Starting sampled root span
    op: < unknown op >
    name: GET /api/hello
    ID: 9430fe88eb7018e4
   ⨯ SyntaxError: Unexpected token ':'
      at Object.compileFunction (ext:core/01_core.js:1106:31)
  Sentry Logger [log]: [Tracing] Finishing "< unknown op >" root span "GET /api/hello" with ID 9430fe88eb7018e4

curl results, all routes, default wiring:
  /api/hello -> Internal Server Error   /users/42 -> 500   /api/error -> 500   /api/log -> 500

sink, default wiring (the only thing Sentry sends is a URL-named, failed transaction):
  [ { "type": "transaction", "name": "GET /api/hello", "op": "http.server",
      "source": "custom", "status": "internal_error", "spans": [] } ]

--- B. With `enableRuntimeChannelInjection: false` (traceLifecycle 'static') ---
transaction | GET /api/hello   | ["undefined resolve page components","undefined executing api route (app) /api/hello/route","undefined start response"] | src= route
transaction | GET /users/[id]  | ["undefined resolve page components","undefined executing api route (app) /users/[id]/route","undefined start response"] | src= route
transaction | GET /api/db      | ["undefined resolve page components","undefined executing api route (app) /api/db/route","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users","undefined start response"] | src= route
transaction | GET /api/error   | ["undefined resolve page components","undefined executing api route (app) /api/error/route"] | src= route
event       | boom-route-handler
event       | sentinel-opt

full error event:
  { "type": "event", "exception": "boom-route-handler",
    "mechanism": "auto.function.nextjs.route_handler", "handled": false,
    "sdk": "sentry.javascript.nextjs",
    "runtime": { "name": "node", "version": "v26.3.0" },
    "trace_id": "31da1c4220324ff1b6d9b05b7fecbb0c",
    "parent_span_id": "9699426e490b6a72",
    "transaction": "GET /api/error", "hasContextLine": false }
```

## Observed on 2026-09-07

Rebuilt from scratch and run once. `deno run -A node_modules/next/dist/bin/next build` succeeded first
try. Environment drift from the record: `mysql2@^3` now resolves to **3.24.3** and `mysql@^2` to
**2.18.1**; the machine's `node` (used only for the sink and recorder) is now v26.5.0, though Deno still
reports `process.version` as `v26.3.0` on the wire, exactly as recorded.

### A. Default docs wiring, `PROBE_INJECTION_ON=1` (injection left enabled)

```
/api/hello -> 500  body: Internal Server Error
/users/42  -> 500
/api/error -> 500
/api/log   -> 500

server-injection-on.log:7    Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
server-injection-on.log:119  Sentry Logger [warn]: [instrumentation] failed to inject diagnostics-channel into mysql2: [TypeError: transform is not a function]
server-injection-on.log:120-129
  Sentry Logger [log]: Http.Server Handling incoming request
  Sentry Logger [log]: Http.Server Patching request.on
  Sentry Logger [log]: [Tracing] Starting sampled root span
    op: < unknown op >
    name: GET /api/hello
    ID: 9c3c5857e6c6ea19
   ⨯ SyntaxError: Unexpected token ':'
      at Object.compileFunction (ext:core/01_core.js:1106:31)
  Sentry Logger [log]: [Tracing] Finishing "< unknown op >" root span "GET /api/hello" with ID 9c3c5857e6c6ea19

sink (items-injection-on.json), all five requests:
{"type": "transaction", "name": "GET /api/hello", "op": "http.server", "source": "custom", "status": "internal_error", "trace_id": "1f36a702e926405e9432f21e8d37407c", "spans": []}
{"type": "transaction", "name": "GET /users/42", "op": "http.server", "source": "custom", "status": "internal_error", "trace_id": "25146e1e32bf4524a79d4f495eea3ba2", "spans": []}
{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "custom", "status": "internal_error", "trace_id": "942ae74b08da4365ac3d5f2d87210f07", "spans": []}
{"type": "transaction", "name": "GET /api/log", "op": "http.server", "source": "custom", "status": "internal_error", "trace_id": "3b7e1137322e463fb99dc93db90f35eb", "spans": []}
```

### B. With `enableRuntimeChannelInjection: false`, `traceLifecycle: 'static'`

All routes return 200 (`/api/error` 500s on purpose). Verbatim sink items (`items-static.json`):

```
{"type": "event", "exception": "Error: boom-route-handler", "mechanism": "auto.function.nextjs.route_handler", "handled": false, "sdk": "sentry.javascript.nextjs", "sdkVersion": "10.67.0", "runtime": {"name": "node", "version": "v26.3.0"}, "hasContextLine": false, "transaction": "GET /api/error", "trace_id": "c00dbdaa307e43c0bd88fb18d74fa12b", "parent_span_id": "8d7ac0d45107003f", "environment": "production"}
{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "c00dbdaa307e43c0bd88fb18d74fa12b", "spans": ["resolve page components", "executing api route (app) /api/error/route"]}
{"type": "transaction", "name": "GET /users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "7b8cdbb716a249b1bac89367750b1db7", "spans": ["resolve page components", "executing api route (app) /users/[id]/route", "start response"]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "route", "status": "ok", "spans": ["resolve page components", "executing api route (app) /api/db/route", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users", "start response"]}
{"type": "transaction", "name": "GET /api/db1", "op": "http.server", "source": "route", "status": "ok", "spans": ["resolve page components", "executing api route (app) /api/db1/route", "start response"]}
{"type": "log", "items": ["info: probe-log-from-route-handler"]}
{"type": "transaction", "name": "GET /api/fetch", "op": "http.server", "source": "route", "status": "ok", "spans": ["resolve page components", "executing api route (app) /api/fetch/route", "start response"]}
{"type": "transaction", "name": "GET /api/hello", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "bbbbbbbbbbbbbbbb", "spans": ["resolve page components", "executing api route (app) /api/hello/route", "start response"]}

{"type": "event", "exception": "Error: iso-alpha",   "transaction": "GET /api/iso", "trace_id": "32b2a8e19d2a4c4fb48d8b954a2ab99a", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-bravo",   "transaction": "GET /api/iso", "trace_id": "53a733af9b5d410cac19edd7a7f86a3b", "tags": {"probe_tag": "bravo"}}
{"type": "event", "exception": "Error: iso-charlie", "transaction": "GET /api/iso", "trace_id": "b2905f6e7a194b1bae7d16b3f428674b", "tags": {"probe_tag": "charlie"}}
{"type": "transaction", "name": "GET /api/iso", "trace_id": "32b2a8e19d2a4c4fb48d8b954a2ab99a", "tags": {"probe_tag": "alpha"}}
{"type": "transaction", "name": "GET /api/iso", "trace_id": "53a733af9b5d410cac19edd7a7f86a3b", "tags": {"probe_tag": "bravo"}}
{"type": "transaction", "name": "GET /api/iso", "trace_id": "b2905f6e7a194b1bae7d16b3f428674b", "tags": {"probe_tag": "charlie"}}

recorder /__hits: [{"url":"/rec","sentryTrace":null,"baggage":null}]
```

`db1` (`mysql@2`, module-scope `createConnection`) returns rows but contributes no `db` span, exactly as
recorded. The nested Next.js spans print without the recorded `undefined ` prefix only because this
cell's `sink.mjs` formats a missing op as an empty string instead of `undefined`; the spans still carry
no `sentry.op`.

### C. `traceLifecycle: 'stream'` (`items-stream.json`)

```
{"type": "span", "items": ["executing api route (app) /users/[id]/route", "start response", "http.server GET /users/[id]"], "raw": [..., {"name": "GET /users/[id]", "status": "ok", "is_segment": true, "origin": "auto"}]}
{"type": "span", "items": ["resolve page components", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT users"], "raw": [..., {"name": "mysql2.pool.connect", "origin": "auto.db.mysql2.diagnostic_channel"}, {"name": "mysql2.connect", "origin": "auto.db.mysql2.diagnostic_channel"}, {"name": "SELECT users", "origin": "auto.db.mysql2.diagnostic_channel"}]}
{"type": "span", "items": ["executing api route (app) /api/fetch/route", "start response", "http.server GET /api/fetch"]}

recorder /__hits: [{"url":"/rec","sentryTrace":null,"baggage":null},{"url":"/rec2","sentryTrace":null,"baggage":null}]
```

### Match against the record

| capability | recorded | observed | match |
| --- | --- | --- | --- |
| errors | works | works | yes |
| route names | works | works | yes |
| isolation | works | works | yes |
| incoming trace | works | works | yes |
| outgoing fetch | broken | broken | yes |
| db spans | partial | partial | yes |
| logs | works | works | yes |
| client errors | not-run | not-run | yes |

All eight verdicts reproduce, and so does the headline: with the default wiring every request 500s with
`SyntaxError: Unexpected token ':' at Object.compileFunction (ext:core/01_core.js:1106:31)`, an error
that names neither Sentry nor JSON, and the only telemetry Sentry emits is a URL-named
(`source: "custom"`) `internal_error` transaction with no spans. Adding `enableRuntimeChannelInjection:
false` makes the whole app and every capability except outgoing `fetch` work. The debug log line numbers
match the record exactly (`:7` for the `Module.registerHooks()` registration, `:119` for the mysql2
`transform is not a function` warning).

### Files left behind

`node_modules` was removed after the run; the Install line restores it. `.next/` is 117 MB (112 MB of it
is `.next/cache`), well over the 50 MB keep-threshold, and `next build` has to be re-run anyway because
it needs `node_modules` — delete `.next/` before archiving. `build.log`, `sink.log`, `recorder.log`,
`server-static.log`, `server-stream.log`, `server-injection-on.log`, `items-static.json`,
`items-stream.json` and `items-injection-on.json` are this run's raw output, kept as the evidence behind
the tables above. The probe rules forbid `rm` on anything but `node_modules`, so none of these could be
cleaned up in-session.
