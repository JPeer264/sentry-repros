# M-nextjs-bun

## What it reproduces

Next.js 15.5.4 (app router) with `@sentry/nextjs` 10.67.0 (the `develop` / v11 line, built from
`getsentry/sentry-javascript@6f2da7483d`) running on bun via `bun --bun next build` / `bun --bun next start`.
The app is API-routes-only and exercises seven server-side capabilities through an envelope sink and a
local fetch recorder: unhandled errors in a route handler, parameterized route names, isolation-scope
separation across concurrent requests, incoming `sentry-trace` continuation, outgoing `fetch`
instrumentation, `mysql2` database spans from a module-scope pool, and `Sentry.logger` log envelopes.
Two wiring details are load-bearing on `develop`: `withSentryConfig` lives on the `@sentry/nextjs/config`
subpath (not the main entry), and TypeScript must be pinned to 5.x because Next 15.5.4's
`verifyTypeScriptSetup` resolves `typescript/lib/typescript.js`, which TypeScript 6 does not export.

## Install

```
cd $REPRO/cells/M-nextjs-bun
npm install --no-audit --no-fund
```

`package.json` pins every `@sentry/*` package to the 10.67.0 tarball in
`../../_toolbox/pack/` (the durable mirror of `$REPRO/_toolbox/pack`), so one `npm install` restores the whole tree.
Use `npm`, not `bun add`: `bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps.
`typescript` is pinned to 5.9.2 on purpose (see above) and `mysql2` to 3.24.3, the version this run used.

## Run

```
D=$REPRO/cells/M-nextjs-bun
cd $D

# sink + fetch recorder
PORT=43117 node sink.mjs     > sink.log     2>&1 &  SINK_PID=$!
PORT=43119 node recorder.mjs > recorder.log 2>&1 &  REC_PID=$!

bun --bun ./node_modules/.bin/next build

SENTRY_TUNNEL=http://127.0.0.1:43117/ RECORDER_URL=http://127.0.0.1:43119 \
  SENTRY_LIFECYCLE=static SENTRY_DEBUG=1 \
  bun --bun ./node_modules/.bin/next start -p 43118 > server-static.log 2>&1 &  APP_PID=$!

B=http://127.0.0.1:43118
curl -s $B/api/error                                  # errors
curl -s $B/api/users/42                               # route name
for t in alpha bravo charlie; do curl -s "$B/api/iso?tag=$t" & done; wait   # isolation
curl -s -H "sentry-trace: aaaabbbbccccddddeeeeffff00001111-1234567890abcdef-1" \
     -H "baggage: sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-sampled=true" \
     $B/api/users/7                                   # incoming trace
curl -s $B/api/fetchout                               # outgoing fetch
curl -s $B/api/db                                     # db spans
curl -s $B/api/logs                                   # logs
curl -s "$B/api/sentinel?n=1"                         # sentinel, then wait for it in the sink

curl -s http://127.0.0.1:43117/__items | python3 -m json.tool
curl -s http://127.0.0.1:43119/__hits  | python3 -m json.tool

# stream lifecycle variant
SENTRY_LIFECYCLE=stream ... bun --bun ./node_modules/.bin/next start -p 43118

kill $APP_PID; kill $SINK_PID; kill $REC_PID
```

## Expected

Recorded verdicts (record id `M-nextjs-bun` in `_records/cells.json`):

| capability | recorded verdict |
| --- | --- |
| errors | works |
| route names | **partial** - name carries a spurious `/app` prefix, and `event.transaction` disagrees with the transaction name |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** - no `http.client` span, no `sentry-trace`/`baggage` on the wire |
| db spans | **broken** - module-scope `mysql2/promise` pool produces no `db` span |
| logs | works |
| client errors | not-run (out of scope, API routes only) |

Recorded evidence lines:

```
{"type":"event","exception":"M-nextjs-bun route handler boom","mechanism":"auto.function.nextjs.route_handler","handled":false,"sdk":"sentry.javascript.nextjs","sdkVersion":"10.67.0","runtime":{"name":"node","version":"v26.3.0"},"transaction":"GET /api/error","trace_id":"28b8eb72b18e439e9c905b92dfaa27e2","parent_span_id":"832c496850a18378","hasContextLine":false}
{"type":"transaction","name":"GET /app/api/error","op":"http.server","source":"route","status":"internal_error","spans":["undefined resolve page components","undefined executing api route (app) /app/api/error/route"]}
{"type":"transaction","name":"GET /app/api/users/[id]","op":"http.server","source":"route","status":"ok","spans":["undefined resolve page components","undefined executing api route (app) /app/api/users/[id]/route","undefined start response"]}

EVENT iso-alpha   | tags= {'probe_tag': 'alpha'}   | trace= 3489b857d651409da6eaab66f79705a8 | tx= GET /api/iso
EVENT iso-bravo   | tags= {'probe_tag': 'bravo'}   | trace= 0a46e903f1914ae59d751cd619ca836a | tx= GET /api/iso
EVENT iso-charlie | tags= {'probe_tag': 'charlie'} | trace= bf74b9e189b74a939fcf455b992bac31 | tx= GET /api/iso

TX GET /app/api/users/[id] | src= route | trace= aaaabbbbccccddddeeeeffff00001111 parent= 1234567890abcdef

=== outgoing fetch (static) - recorder /__hits ===
[ { "url": "/rec", "sentryTrace": null, "baggage": null } ]

=== db (static), module-scope mysql2 pool, query returned rows ===
{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
TX GET /app/api/db | spans= ['undefined resolve page components', 'undefined executing api route (app) /app/api/db/route', 'undefined start response']
server.log:113: Sentry Logger [log]: [Sentry] Runtime hook not registered
server.log:114: Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
.next/server/app/api/db/route.js:  require("mysql2/promise")      <- left external, never patched

=== logs (static) ===
log ['info: M-nextjs-bun log from route handler']
```

## Observed on 2026-09-07

Rebuilt and run once. Environment drift from the record: the machine's `bun` is now **1.4.2**
(the record says 1.4.0; no 1.4.0 binary is on this machine), and `mysql2@^3` now resolves to
**3.24.3**, which ships its own `diagnostics_channel` tracing channels in `lib/tracing.js`
(`mysql2:query`, `mysql2:connect`, `mysql2:pool:connect`, `mysql2:execute`).

Verbatim sink items, `traceLifecycle: 'static'`:

```
{"type": "event", "exception": "Error: M-nextjs-bun route handler boom", "mechanism": "auto.function.nextjs.route_handler", "handled": false, "sdk": "sentry.javascript.nextjs", "sdkVersion": "10.67.0", "runtime": {"name": "node", "version": "v26.3.0"}, "hasContextLine": true, "transaction": "GET /api/error", "trace_id": "a4f7f85b77c344f098c15ee2c11312fb", "parent_span_id": "bc23aaa715826a5b", "environment": "production"}
{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "a4f7f85b77c344f098c15ee2c11312fb", "spans": ["resolve page components", "executing api route (app) /api/error/route"]}
{"type": "transaction", "name": "GET /api/users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "5af6e23ac1594fae88119559ab665b7f", "spans": ["resolve page components", "executing api route (app) /api/users/[id]/route", "start response"]}

{"type": "event", "exception": "Error: iso-alpha", "transaction": "GET /api/iso", "trace_id": "1c56adbdf9d3478e8f81cc70afce6997", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-bravo", "transaction": "GET /api/iso", "trace_id": "fa06a8a6693949aca710a619b03d4a75", "tags": {"probe_tag": "bravo"}}
{"type": "event", "exception": "Error: iso-charlie", "transaction": "GET /api/iso", "trace_id": "a6297991f6d14132bab7982522de5729", "tags": {"probe_tag": "charlie"}}
{"type": "transaction", "name": "GET /api/iso", "trace_id": "1c56adbdf9d3478e8f81cc70afce6997", "tags": {"probe_tag": "alpha"}}
{"type": "transaction", "name": "GET /api/iso", "trace_id": "a6297991f6d14132bab7982522de5729", "tags": {"probe_tag": "charlie"}}
{"type": "transaction", "name": "GET /api/iso", "trace_id": "fa06a8a6693949aca710a619b03d4a75", "tags": {"probe_tag": "bravo"}}

{"type": "transaction", "name": "GET /api/users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaabbbbccccddddeeeeffff00001111", "parent_span_id": "1234567890abcdef", "spans": ["resolve page components", "executing api route (app) /api/users/[id]/route", "start response"]}

recorder /__hits: [ { "url": "/rec", "sentryTrace": null, "baggage": null } ]
{"type": "transaction", "name": "GET /api/fetchout", "spans": ["resolve page components", "executing api route (app) /api/fetchout/route", "start response"]}

{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "route", "status": "ok", "spans": ["resolve page components", "executing api route (app) /api/db/route", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users", "start response"]}
server-static.log:113: Sentry Logger [log]: [Sentry] Runtime hook not registered
server-static.log:114: Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
.next/server/app/api/db/route.js:  require("mysql2/promise")      <- still external, still unpatched

{"type": "log", "items": ["info: M-nextjs-bun log from route handler"]}
```

`traceLifecycle: 'stream'`:

```
SPAN http.server GET /api/users/[id] | origin= auto | seg= True
SPAN db mysql2.pool.connect          | origin= auto.db.mysql2.diagnostic_channel | seg= False
SPAN db mysql2.connect               | origin= auto.db.mysql2.diagnostic_channel | seg= False
SPAN db SELECT users                 | origin= auto.db.mysql2.diagnostic_channel | seg= False
SPAN http.server GET /api/db         | origin= auto | seg= True
```

### Match against the record

| capability | recorded | observed | match |
| --- | --- | --- | --- |
| errors | works | works | yes (`hasContextLine` is now `true`, not `false`) |
| route names | partial (`/app` prefix) | **works** - `GET /api/users[id]` with `source: route`, and `event.transaction` agrees | **no** |
| isolation | works | works | yes |
| incoming trace | works | works | yes |
| outgoing fetch | broken | broken | yes |
| db spans | broken | **works** - three `db` spans, origin `auto.db.mysql2.diagnostic_channel` | **no** |
| logs | works | works | yes |
| client errors | not-run | not-run | yes |

Five of the eight verdicts reproduce exactly. Two do not:

- **route names** no longer carry the `/app` prefix and the event/transaction names agree, so the
  recorded `partial` is now a clean `works`. Nothing in the app differs from the recorded setup, so
  this looks like a Next.js/`@sentry/nextjs` naming fix rather than a rebuild error.
- **db spans** now work, and the recorded root cause is still literally true: the Sentry runtime hook
  is still not registered on bun (`[Sentry] Runtime hook not registered`), the bundler plugin still
  injects nothing (`injected libraries=[]`), and `mysql2/promise` is still left external and unpatched
  in `.next/server/app/api/db/route.js`. The spans arrive because `mysql2` 3.24.3 publishes its own
  `diagnostics_channel` tracing channels, which the SDK's eager `Bun/Deno, subscribing eagerly` branch
  subscribes to directly. The SDK-side gap the record describes is unchanged; only the driver moved.

The bun-specific observation in the record still holds: every diagnostics-channel instrumentation takes
the `Bun/Deno, subscribing eagerly` branch, the SDK warns
`No available Node API to register diagnostics-channel injection hooks; skipping.`, and
`contexts.runtime` on the wire is `{"name":"node","version":"v26.3.0"}` with nothing naming bun.

### Files left behind

`.next/` is kept from the recorded build, but `.next/cache/` is 111 MB of webpack cache, so the
directory is well over the 50 MB keep-threshold and `next build` has to be re-run anyway (it needs
`node_modules`). Delete `.next/` before archiving. `app.pid`, `sink.log`, `recorder.log`,
`server-static.log`, `server-stream.log`, `items-static.json` and `items-stream.json` are this run's
raw output, kept as the evidence behind the table above. The probe agent's rules forbid `rm` on
anything but `node_modules`, so none of these could be cleaned up in-session.
