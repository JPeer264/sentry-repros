# verify4-M-hapi-deno-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-hapi-deno` (see `$REPRO/cells/M-hapi-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.md`, `app-body.ts`, `build.mjs`, `deno.json`, `drive.mjs`, `exports-check.ts`, `init.ts`, `items2-A-nohook-static.json`, `items2-B-nohook-manual-static.json`, `items2-C-nohook-manual-stream.json`, `items2-E-esbuild-static.json`, `items2-F-esbuild-stream.json`, `json-fix.mjs`, `main-hook-jsonfix.ts`, `main-hook.ts`, `main-nohook.ts`, `package-lock.json`, `package.json`, `r2-A-nohook-static.log`, `r2-B-nohook-manual-static.log`, `r2-C-nohook-manual-stream.log`, `r2-E-esbuild-static.log`, `r2-F-esbuild-stream.log`, `run-A-nohook-static.log`, `run-B-nohook-manual-static.log`, `run-C-nohook-manual-stream.log`, `run-D-hook-nojsonfix.log`, `run-E-esbuild-static.log`, `run-F-esbuild-stream.log`, `run.sh`, `run2.sh`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Refuted. The Hapi error event on Deno 2.9.0 does NOT hinge on `@sentry/deno/import` or the `json-fix.mjs` load-hook workaround. Two hook-free routes both deliver it, and one of them additionally fixes route names and library spans.

Probe dir: $SCRATCH/deep/verify4-M-hapi-deno-errors/ (deno.json, init.ts, app-body.ts, main-nohook.ts, main-hook.ts, json-fix.mjs, build.mjs, exports-check.ts, drive.mjs, run2.sh, items2-*.json, r2-*.log, RERUN.md). node_modules kept (@hapi/hapi 21.4.10, mysql@2, esbuild 0.28, @sentry/{deno,core,server-utils,server-runtime-injection,opentelemetry} 10.67.0 from $S/pack tarballs). deno.json `nodeModulesDir: "manual"`.

Sink: `PORT=47318 node $S/qs/sink.mjs > sink2.log 2>&1 &` (killed at the end).

--- A: baseline, no hook, no manual handler, static (reproduces the reported loss) ---
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"1d1a834bfc8147719b4ac2d8c2bd0b72","sdk":"sentry.javascript.deno","spans":[]}
    (no event for /error)

--- B: FIX 1. no hook, no json-fix, one line `attachHapiErrorHandler(server)`, static ---
`./run2.sh main-nohook.ts 41792 B-nohook-manual-static LIFECYCLE=static MANUAL_ERR_HANDLER=1`
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"46429ceb41274d57a0b21caf7a4e84d6","sdk":"sentry.javascript.deno","spans":[]}
{"type":"event","exception":"Error: hapi boom","mechanism":"auto.function.hapi","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"transaction":"GET /error","trace_id":"46429ceb41274d57a0b21caf7a4e84d6","request":{"url":"http://127.0.0.1:41792/error","method":"GET"}}
Event and transaction share the trace_id, mechanism/handled/context line identical to the hook variant.

--- C: same fix, stream lifecycle ---
{"type":"event","exception":"Error: hapi boom","mechanism":"auto.function.hapi","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"transaction":"GET /error","trace_id":"430cd226c9a64728af3dbe221058c9b8"}
{"type":"span","trace_id":"430cd226c9a64728af3dbe221058c9b8","items":["http.server GET"],"raw":[{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.server"}]}

--- E: FIX 2. esbuild + sentryOrchestrionPlugin, NO runtime hook, NO json-fix, NO manual handler, static ---
`node build.mjs && ./run2.sh dist/main.js 41794 E-esbuild-static LIFECYCLE=static MANUAL_ERR_HANDLER=0`
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"5868783578b2412887f1f501bc11957b","spans":["router GET /error"]}
{"type":"event","exception":"Error: hapi boom","mechanism":"auto.function.hapi","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"transaction":"GET /error","trace_id":"5868783578b2412887f1f501bc11957b"}
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","spans":["router GET /users/{id}"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["router GET /db","db SELECT * FROM users"]}
Strictly better than the hook route: parameterized route names (source "route"), hapi router spans and mysql db spans.

--- F: same bundle, stream lifecycle ---
{"type":"event","exception":"Error: hapi boom","mechanism":"auto.function.hapi","handled":false,"transaction":"GET /error","trace_id":"030aa030d21649e59be46a26b8995e86"}
{"type":"span","trace_id":"3b5f12959d3e40659f6764263c601da4","items":["db SELECT users","router /db","http.server GET /db"],"raw":[{"name":"SELECT users","origin":"auto.db.mysql"},{"name":"/db","origin":"auto.http.hapi"},{"name":"GET /db","is_segment":true,"origin":"auto.http.server"}]}

--- D: control, import hook without json-fix still crashes at boot (unchanged) ---
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const Pkg = require('../package.json');
    at Object.<anonymous> (.../node_modules/@hapi/validate/lib/common.js:6:13)

The real defect is narrower and different from what was reported: `@sentry/deno` does not export the documented public helper. `deno run exports-check.ts` prints
  deno.attachHapiErrorHandler: undefined
  deno.setupHapiErrorHandler: undefined
  deno.hapiIntegration: function
  server-utils.attachHapiErrorHandler: function
`setupHapiErrorHandler` is exported by @sentry/{node,bun,elysia,astro,remix,solidstart,aws-serverless,google-cloud-serverless} (see ~/dev/sentry-worktrees/audit-runtime-docs/packages/node/src/index.ts:50) but not by packages/deno/src/index.ts, which exports only `hapiIntegration` (line 129). The underlying function is reachable because `@sentry/server-utils` is a direct dependency of `@sentry/deno` (packages/deno/package.json), so no extra install is needed, only an import-map entry.

Rerun: cd into the probe dir, start the sink, then `./run2.sh main-nohook.ts <port> <label> LIFECYCLE=static MANUAL_ERR_HANDLER=1`.

## Workaround

Drop the import hook and the JSON load-hook workaround entirely. Add one line to the Hapi app (before or after `server.start()`, both work):

  import { attachHapiErrorHandler } from "@sentry/server-utils";
  attachHapiErrorHandler(server);

with `"@sentry/server-utils": "npm:@sentry/server-utils"` in deno.json `imports`. Entry becomes just `import "./init.ts"; import "./app-body.ts";`. Works on both `traceLifecycle: 'static'` and `'stream'`.

Better variant when route names and db/router spans are also wanted: bundle with esbuild plus `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild` (`platform: 'node'`, `format: 'esm'`, `external: ['@sentry/deno','@sentry/server-utils']`, a `createRequire` banner, `loader: {'.json':'json'}`) and run `deno run dist/main.js`. No runtime hook, no json-fix, no manual handler call, and route names become `GET /users/{id}` with `auto.http.hapi` router spans and `auto.db.mysql` spans.

## Docs impact

On Deno, `Sentry.setupHapiErrorHandler(server)` from the Hapi guide is not available: `@sentry/deno` does not export it. Call `attachHapiErrorHandler(server)` from `@sentry/server-utils` instead (already a dependency of `@sentry/deno`; add `"@sentry/server-utils": "npm:@sentry/server-utils"` to `deno.json` imports) - without it a throw in a Hapi route handler is swallowed into a Boom 500 and no error event is sent, and with it the event arrives with `mechanism: auto.function.hapi`, `handled: false`, on both trace lifecycles, with no import hook and no JSON load-hook workaround needed.
