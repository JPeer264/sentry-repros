# M-remix-deno: Remix v2 (2.17.x, Remix Vite plugin, custom node:http server via `createRequestHandler` from `@remix-run/server-runtime`) on Deno 2.9.0, `nodeModulesDir: "manual"`, npm-produced node_modules

## What it reproduces

Time-box respected; scaffold reused the Remix app from $S/deep/verify4-M-remix-bun-dbspans (app/, tsconfig, db.mjs) and the Deno adapter shape from $S/deep/verify4-M-reactrouter-deno-outgoingfetch. All processes killed (appA-appH, sink, recorder, plain); node_modules deleted (dir is now 908K).

Findings worth flagging beyond the per-capability verdicts:

1. NEW: the "instrument first" ordering that every Sentry docs page teaches is actively harmful for Remix on Deno. `@sentry/server-runtime-injection`'s module hook makes Deno's CJS loader reject `require('*.json')` (`SyntaxError: Unexpected token ':'`), so any driver that reads its own package.json (mysql2 does) crashes the process at import if it is loaded after `Sentry.init`. This is the K3 bug reached through @sentry/node rather than through `@sentry/deno/import`. Deno bug denoland/deno#36240, but the SDK is what triggers it.

2. NEW: on Deno the SDK prints "`@sentry/server-runtime-injection` was bundled into your application, so mysql2 ... load uninstrumented" for an entry that is not bundled at all (plain .mjs, real node_modules). The advice in that warning is wrong for this runtime, and it appears immediately before the crash in 1., which will send users down the wrong path.

3. NEW: db spans need no instrumentation path on Deno. mysql2 ships native diagnostics_channel support (`mysql2/lib/tracing.js`) and the SDK's Bun/Deno "subscribing eagerly" branch picks it up, so neither the `@sentry/deno/import` hook nor an esbuild/orchestrion plugin is required. That also means the injection hook buys nothing for mysql2 on Deno while costing the crash in 1.

4. NEW: the obvious userland fix for the missing-fetch-span gap (wiring core's `addFetchInstrumentationHandler` + `instrumentFetchRequest` in a custom integration) propagates `sentry-trace`/`baggage` correctly but silently suppresses every server transaction/span for the whole process. Debug output shows the `http.server` root span is never finished. Worth an SDK issue on its own; it is the workaround a user would most plausibly reach for.

5. Confirms K2 (no fetch span, no trace headers on Deno) for the @sentry/node-based framework SDKs, not just @sentry/deno.

6. `@remix-run/express` was deliberately not used: express hits K3 at import on Deno once the Sentry hook is installed. A `node:http` + `createRequestHandler(Sentry.instrumentBuild(build))` custom server is the only shape that works, and it is undocumented for Remix outside Cloudflare/Hydrogen.

7. Both traceLifecycle values behave the same for every capability tested; stream additionally names the segment span `http.server GET users/:id` with `is_segment: true`, and the db span is the low-cardinality `SELECT users` instead of `SELECT id, name FROM users`.

8. Client-side (browser) Sentry was not probed; the cell is about the server runtime.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Remix runs on Deno unchanged. Wiring that a docs page would have to show:

1. Install with npm under node (not `deno add`, not `bun add`), so the tarballs' transitive `@sentry/*@10.67.0` deps resolve:
   `npm install --legacy-peer-deps $S/pack/sentry-{remix,node,core,react,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz '@remix-run/dev@^2.17.0' '@remix-run/node@^2.17.0' '@remix-run/react@^2.17.0' '@remix-run/server-runtime@^2.17.0' react react-dom vite@^5 mysql2 typescript`
2. `deno.json`: `{ "nodeModulesDir": "manual" }`.
3. `vite.config.ts`: `plugins: [remix(), sentryRemixVitePlugin()]` (from `@remix-run/dev` and `@sentry/remix`). The plugin runs at build time under node and prints `[Sentry Remix] Found 5 static and 3 dynamic routes`; the emitted route manifest is what makes parameterized transaction names work at runtime.
4. `app/entry.server.tsx`: `export const handleError = Sentry.sentryHandleError;`
5. `instrument.server.mjs`: `import * as Sentry from '@sentry/remix'; Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static' | 'stream' })`.
6. Server entry: `import './instrument.server.mjs'` first, then `createRequestHandler(Sentry.instrumentBuild(build), 'production')` over `node:http`. Do NOT use `@remix-run/express` / express on Deno — express dies at import on Deno via the known `require('*.json')` bug once the Sentry runtime hook is installed.
7. Build under node: `npx remix vite:build`. Run under Deno: `deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs`.

CAVEAT that must be in any such docs page: any CommonJS dependency that does `require('*.json')` (mysql2 does, `mysql2/lib/connection_config.js:13`) must be imported BEFORE `./instrument.server.mjs`, otherwise the process dies at startup. That inverts the usual "instrument first" rule.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
W=$S/deep/M-remix-deno

# install (node/npm; node_modules was deleted after the run to save disk)
cd $W && npm install --legacy-peer-deps \
  $S/pack/sentry-{remix,node,core,react,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz \
  '@remix-run/dev@^2.17.0' '@remix-run/node@^2.17.0' '@remix-run/react@^2.17.0' \
  '@remix-run/server-runtime@^2.17.0' react react-dom vite@^5 mysql2 typescript

# build under node
cd $W && npx remix vite:build

# sinks (node)
PORT=41730 node $W/sink.mjs > $W/sink.log 2>&1 &
PORT=41732 node $W/recorder.mjs > $W/rec.log 2>&1 &

# baseline: Remix on Deno without Sentry
cd $W && PORT=41731 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server-plain.mjs

# Sentry, no db (errors / route names / isolation / incoming trace / outgoing fetch / logs)
cd $W && PORT=41731 RECORDER_PORT=41732 SINK_URL=http://127.0.0.1:41730/ TRACE_LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs

# db spans (driver imported before instrument); TRACE_LIFECYCLE=stream for the streaming variant
cd $W && PORT=41731 RECORDER_PORT=41732 SINK_URL=http://127.0.0.1:41730/ TRACE_LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server-dbfirst.mjs

# canonical order crash reproduction
cd $W && PORT=41731 SINK_URL=http://127.0.0.1:41730/ WITH_DB=1 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs

# hand-wired core fetch instrumentation variant
cd $W && PORT=41731 RECORDER_PORT=41732 SINK_URL=http://127.0.0.1:41730/ SENTRY_VARIANT=core-fetch \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs

# drive
TR=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
curl -s -o /dev/null http://127.0.0.1:41731/users/42
curl -s -o /dev/null http://127.0.0.1:41731/boom/7
curl -s -o /dev/null http://127.0.0.1:41731/fetchout
curl -s -o /dev/null http://127.0.0.1:41731/db
curl -s -o /dev/null http://127.0.0.1:41731/log
curl -s -o /dev/null -H "sentry-trace: $TR-bbbbbbbbbbbbbbbb-1" \
  -H "baggage: sentry-trace_id=$TR,sentry-environment=upstream,sentry-public_key=public,sentry-sample_rate=1" \
  http://127.0.0.1:41731/users/99
for i in 1 2 3; do curl -s -o /dev/null http://127.0.0.1:41731/iso/$i & done; wait
curl -s -o /dev/null http://127.0.0.1:41731/sentinel      # sentinel
curl -s http://127.0.0.1:41730/__items | python3 -m json.tool
curl -s http://127.0.0.1:41732/__seen  | python3 -m json.tool
curl -s -X DELETE http://127.0.0.1:41730/__items
```

Files: `README-rerun.txt`, `app/`, `appA.log`, `appA.pid`, `appB.log`, `appB.pid`, `appC.log`, `appC.pid`, `appD.log`, `appD.pid`, `appE.log`, `appE.pid`, `appF.log`, `appF.pid`, `appG.log`, `appG.pid`, `appH.log`, `appH.pid`, `build1.log`, `db.mjs`, `deno-fetch-integration.mjs`, `deno.json`, `instrument.server.mjs`, `package-lock.json`, `package.json`, `plain.log`, `plain.pid`, `rec.log`, `rec.pid`, `recorder.mjs`, `server-dbfirst.mjs`, `server-plain.mjs`, `server.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `t-mysql-plain.mjs`, `tsconfig.json`, `vite.config.ts`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | works | A `throw new Error(...)` in a Remix loader reaches Sentry as an unhandled event with `mechanism: auto.function.remix.server`, `handled: false`, context lines, request data and the transaction name, and the route still returns HTTP 500. Mechanism is `Sentry.sentryHandleError` exported as `handleError` from `app/entry.server.tsx` plus `Sentry.instrumentBuild(build)`; nothing is swallowed. Observed at traceLifecycle static and stream. |
| route names | works | `GET /users/42` produces transaction name `GET users/:id` with `transaction_info.source: route` (static lifecycle) and, in stream lifecycle, the segment span `http.server GET users/:id`. Nested `function LOADER root` and `function LOADER routes/users.$id` spans are present in both lifecycles. Note the name has no leading slash. |
| isolation | works | Three concurrent `GET /iso/:id` requests, each doing `Sentry.setTag` then a 300ms await then `captureException`, produced three transactions with three distinct trace ids and three events each carrying exactly its own `probe_tag` and matching trace id. No cross-talk. Static lifecycle. |
| incoming trace | works | A request with `sentry-trace: aaaa...-bbbbbbbbbbbbbbbb-1` and a sentry baggage header produced a transaction with `trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` and `parent_span_id=bbbbbbbbbbbbbbbb`. Static lifecycle. |
| outgoing fetch | broken | A `fetch()` from inside a loader to a local recorder produced NO `http.client` span and NO `sentry-trace`/`baggage` headers, confirming the known Deno finding K2 for the Remix/node SDK too. Wiring the core `addFetchInstrumentationHandler` + `instrumentFetchRequest` by hand does add both headers, but it then suppresses every server transaction and span envelope for the whole process (even for routes that make no fetch), so it is not a usable workaround. `nativeNodeFetchIntegration` is a no-op here because Deno's global fetch is not undici. |
| db spans | partial | Works, but only with a non-canonical import order. mysql2 ships its own `diagnostics_channel` instrumentation (`mysql2/lib/tracing.js`), which the SDK subscribes to eagerly on Deno, so no instrumentation path is needed at all: no `@sentry/deno/import` hook, no esbuild/orchestrion plugin, no bundler plugin. With mysql2 imported BEFORE `instrument.server.mjs` a module-scope pool yields `db mysql2.pool.connect`, `db mysql2.connect`, `db SELECT id, name FROM users` (static) / `db SELECT users` (stream) nested under the route transaction. With the canonical order (instrument first, driver after) the process dies at startup: `@sentry/server-runtime-injection`'s module hook makes Deno reject mysql2's `require('../package.json')` with `SyntaxError: Unexpected token ':'`, the same class as known finding K3. The SDK also prints a false-positive warning claiming the injection package was bundled, which it was not. |
| logs | works | `Sentry.logger.info('probe-log-from-loader', { where: 'remix-deno' })` in a loader arrived as a log envelope item `info: probe-log-from-loader` after the ~7s flush timer. Static lifecycle. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
--- Remix runs on Deno with no Sentry (server-plain.mjs, plain.log):
READY http://127.0.0.1:41731
$ curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:41731/users/42   -> 200
<!DOCTYPE html><html lang="en"><head><link rel="modulepreload" href="/assets/manifest-30b37c12.js"/>...

--- route names + errors, traceLifecycle static (sink /__items):
{"type":"transaction","name":"GET users/:id","op":"http.server","source":"route","status":"ok",
 "trace_id":"4372ac01a20248de9f8e33a0ba1f9a1c","sdk":"sentry.javascript.remix",
 "spans":["function LOADER root","function LOADER routes/users.$id"]}
{"type":"transaction","name":"GET boom/:id","op":"http.server","source":"route","status":"internal_error",
 "spans":["function LOADER root","function LOADER routes/boom.$id"]}
{"type":"event","exception":"Error: probe-loader-boom-7","mechanism":"auto.function.remix.server",
 "handled":false,"sdk":"sentry.javascript.remix","runtime":"node","hasContextLine":true,
 "transaction":"GET /boom/7","trace_id":"0f1ddb1162114d2483c501aa5063d10e",
 "request":{"url":"http://127.0.0.1:41731/boom/7","method":"GET"}}

--- incoming trace + isolation (static):
TX GET users/:id src= route trace= aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa parent= bbbbbbbbbbbbbbbb
TX GET iso/:id  src= route trace= 3284b59f75cb4529a12b2940f281bcd6 parent= None
TX GET iso/:id  src= route trace= 3976c9fd77dd45b4aa6e1e802e83e9f8 parent= None
TX GET iso/:id  src= route trace= 4faeffa974914363aa312a63efaab062 parent= None
EV Error: iso-error-1 trace= 3284b59f75cb4529a12b2940f281bcd6 tags= {'probe_tag': 'tag-1'}
EV Error: iso-error-2 trace= 3976c9fd77dd45b4aa6e1e802e83e9f8 tags= {'probe_tag': 'tag-2'}
EV Error: iso-error-3 trace= 4faeffa974914363aa312a63efaab062 tags= {'probe_tag': 'tag-3'}

--- outgoing fetch, default integrations (static). Transaction has no http.client child:
{"type":"transaction","name":"GET fetchout","op":"http.server","source":"route","status":"ok",
 "spans":["function LOADER root","function LOADER routes/fetchout"]}
recorder /__seen: [{"url":"/from-remix-loader","sentryTrace":null,"baggage":null}]

--- outgoing fetch with hand-wired core fetch instrumentation (SENTRY_VARIANT=core-fetch):
recorder /__seen: {"url":"/from-remix-loader",
 "sentryTrace":"b0ec67a4a90b4ca3bd3eab1231879eca-b1643f39b4c76a66",
 "baggage":"sentry-environment=probe,sentry-public_key=public,sentry-trace_id=b0ec67a4a90b4ca3bd3eab1231879eca"}
but the sink then holds ONLY the sentinel event, no transactions at all:
[{"type":"event","message":"sentinel", ... }]
and with SENTRY_DEBUG=1 the http.server root span is never finished (no `[Tracing] Finishing "http.server" root span` line),
whereas the identical run without the integration logs:
Sentry Logger [log]: [Tracing] Finishing "http.server" root span "GET users/:id" with ID b4947d4e230fd5d8

--- db spans, driver imported BEFORE instrument (server-dbfirst.mjs), static:
transaction GET db ['function LOADER root', 'function LOADER routes/db', 'db mysql2.pool.connect',
                    'db mysql2.connect', 'db SELECT id, name FROM users']

--- db spans, stream lifecycle:
SPAN ['function LOADER root','db mysql2.pool.connect','db mysql2.connect','db SELECT users',
      'function LOADER routes/db','http.server GET db']
SPAN ['function LOADER root','function LOADER routes/users.$id','http.server GET users/:id']  (is_segment=True on 'GET users/:id')

--- db, canonical order (instrument first, then mysql2) -> process dies (appA.log / appF.log):
[probe] sentry initialized: true lifecycle: static
[Sentry] `@sentry/server-runtime-injection` was bundled into your application, so mysql2 and any other
instrumented dependency load uninstrumented. Keep `@sentry/server-runtime-injection` external in your
server bundle, or use the Sentry bundler plugin for build-time instrumentation.
SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Module._compile (node:module:1691:23)
    at require (node:module:1815:16)
    at Object.<anonymous> (.../node_modules/mysql2/lib/connection_config.js:13:21)
(that line is `const { version } = require('../package.json');`)
$ curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:41731/db  -> 000 (server never listened)

--- same mysql2 query with no Sentry in the process (t-mysql-plain.mjs, deno):
PLAIN OK [ { id: 1, name: "ada" }, { id: 2, name: "linus" } ]

--- logs (static, after 8s):
transaction GET log
log ['info: probe-log-from-loader']

--- SENTRY_DEBUG=1 startup lines worth noting:
Sentry Logger [log]: [instrumentation:mysql2 ...] Bun/Deno, subscribing eagerly
Sentry Logger [log]: SDK initialized from CommonJS
Sentry Logger [log]: [Sentry] Runtime hook registered, injected libraries=[]
Sentry Logger [log]: [Sentry] Bundler plugin did not run
```

## Docs note

No page in ~/dev/sentry-docs mentions Remix on Deno. The Remix guide declares itself node-only in frontmatter: ~/dev/sentry-docs/docs/platforms/javascript/guides/remix/index.mdx:9 lists `categories: - server-node` (and :13 warns only about Remix 3, not about runtimes). Its prerequisites include, ~/dev/sentry-docs/platform-includes/getting-started-prerequisites/javascript.remix.mdx:1-8, requires only "Remix version 2.0.0+" and says nothing about a runtime. `grep -rniI deno` over docs/platforms/javascript/guides/remix/ returns nothing, and `grep -rniI remix` over docs/platforms/javascript/guides/deno/ returns nothing (that guide has only index.mdx and configuration/). The only `instrumentBuild` documentation anywhere is the Cloudflare Hydrogen page, ~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/frameworks/hydrogen-remix.mdx:32,42,69, so a Deno-on-Remix user has no documented custom-server recipe to copy.
