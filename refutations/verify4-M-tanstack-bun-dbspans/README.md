# verify4-M-tanstack-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans (mysql) on TanStack Start (React) 1.168.35 + nitro 3 node-server, @sentry/tanstackstart-react 10.67.0 (develop), run on bun 1.4.0** of cell `M-tanstack-bun` (see `$REPRO/cells/M-tanstack-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-npm/`, `app.pid`, `app2.pid`, `appnode.pid`, `build-npm.log`, `build-npm2.log`, `build1.log`, `dc-gc.mjs`, `dc-test.mjs`, `dc-test2.mjs`, `dc-test3.mjs`, `instrument.server.bun-fix.mjs`, `run-bun-dc.log`, `run-bun-dc2.log`, `run-bun-fast.log`, `run-bun-keepref-static.log`, `run-bun-keepref.log`, `run-bun-obs.log`, `run-bun-stream.log`, `run-bun-stream2.log`, `run-bun.log`, `run-node-stream.log`, `run-npm-bun-keepref.log`, `run-npm-bun-plain.log`, `sink-v2.log`, `sink.log`, `sink.pid`, `v2-build.log`, `v2-ctl.pid`, `v2-final-control.log`, `v2-final-fixed.log`, `v2-fix2.pid`, `v2-fixed.pid`, `v2-fixedstream.pid`, `v2-gc.mjs`, `v2-keepall.pid`, `v2-keepref.pid`, `v2-plain.pid`, `v2-run-bun-fixed-static.log`, `v2-run-bun-fixed-stream.log`, `v2-run-bun-keepall.log`, `v2-run-bun-keepref.log`, `v2-run-bun-plain.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Both halves of the report are refuted: the documented wiring DOES build, and db spans DO get recorded on bun once one extra line keeps the diagnostics channels alive.

Probe dir: $SCRATCH/deep/verify4-M-tanstack-bun-dbspans (app/ = full docs wiring: src/server.ts wrapFetchWithSentry, src/start.ts sentryGlobal*Middleware, instrument.server.mjs, `sentryTanstackStart()` in vite.config.ts, module-scope `mysql.createConnection` in src/routes/api.db-mysql.ts).

1) BUILD BLOCKERS 1+2 DO NOT REPRODUCE. `./node_modules/.bin/vite build` with `sentryTanstackStart()` present AND `mysql` imported at module scope exits 0 (v2-build.log): "✓ built in 3.39s / ℹ Generated .output/nitro.json". No `getVariableForExportName`, no `"default" is not exported by @sentry/conventions/dist/attributes.mjs`. The build-time channel injection is in the output: `grep -c orchestrion:mysql:query app/.output/server/chunks/build/router-CkZFiwOD.mjs` -> 2. What made it work is the dependency set, not the framework: install the whole develop tarball set as overrides (@sentry/{tanstackstart-react,react,browser,node,core,server-utils,server-runtime-injection,opentelemetry,bundler-plugins,browser-utils,feedback,replay,replay-canvas}) — see app/package.json `pnpm.overrides`. A prior npm attempt in this dir also built once nitro resolved (build-npm2.log, same "✓ built"); its earlier failure (build-npm.log) was `ERR_MODULE_NOT_FOUND: Cannot find module 'nitro/vite'`, i.e. a missing dep, not a rollup/export bug. So `@sentry/tanstackstart-react` never has to be hidden behind a globalThis shim.

2) ROOT CAUSE OF THE MISSING DB SPANS IS BUN GC, NOT INJECTION. Bun 1.4.0 drops diagnostics_channel subscribers as soon as the channel object is collected; the SDK subscribes as `diagnosticsChannel.tracingChannel(NAME).subscribe(...)` and keeps no reference (packages/server-utils/src/integrations/mysql.ts and every other channel integration; the Bun/Deno eager branch is packages/server-utils/src/orchestrion/instrumentation.ts:100). Minimal proof, v2-gc.mjs:
  bun 1.4.0:  immediately after subscribe: true / after Bun.gc(true): false / kept-reference channel after Bun.gc(true): true
  node 26.5:  immediately after subscribe: true / after Bun.gc(true): true
Same signal in-app (prior run-bun-obs.log): "[obs] after init: [ true, true, true, true, true ]" then "[obs] t+6s: [ false, false, false, false, false ]".

3) BEFORE/AFTER ON THE SAME FRESH BUILD (traceLifecycle stream, default; sink on 41733, app on 41732, driven by curl).
Control, exactly the documented file, `bun --preload ./.output/server/instrument.server.mjs .output/server/index.mjs` (v2-final-control.log, 0 `op: db` lines):
  [{"type":"span","trace_id":"0dc439df66c44631a20b0e3413ae2d49","items":["middleware globalRequestMiddleware"]}, {... same ...}]
Fixed, same file plus three retained channels (v2-final-fixed.log, 4 `op: db` lines):
  [{"type":"span","trace_id":"c0b4010f5e1f481db289e5588c24bb7e","items":["middleware globalRequestMiddleware","db SELECT","db SELECT users"],"raw":[{"name":"globalRequestMiddleware","is_segment":true,"origin":"auto.middleware.tanstackstart"},{"name":"SELECT","parent_span_id":"a3415e4d3b0f19ce","is_segment":false,"origin":"auto.db.mysql"},{"name":"SELECT users","parent_span_id":"a3415e4d3b0f19ce","is_segment":false,"origin":"auto.db.mysql"}]}, {... second request identical ...}]
`traceLifecycle: 'static'` also records them (v2-run-bun-fixed-static.log) but each db span arrives as its OWN transaction envelope ({"type":"transaction","name":"SELECT 1 + 1 AS solution","op":"db","parent_span_id":...}) because the `middleware globalRequestMiddleware` root finishes before the queries do — stream is the better shape here. Unrelated to db spans, bun still has no `http.server` root span for the nitro node-server (node run of the same build has one: run-node-stream.log "root description: GET /api/db-mysql"); on bun the segment is the request middleware span.

Exact rerun: cd app && ./node_modules/.bin/vite build; cp ../instrument.server.bun-fix.mjs .output/server/instrument.server.fixed.mjs; PORT=41733 node $REPRO/_toolbox/sink.mjs & ; PORT=41732 bun --preload ./.output/server/instrument.server.fixed.mjs .output/server/index.mjs; curl http://127.0.0.1:41732/api/db-mysql; curl http://127.0.0.1:41733/__items. All processes started here were killed; ports 41732/41733 are free.

Caveats: only bun 1.4.0 was available ($SCRATCH/bun1314 no longer exists), so I could not check whether older bun keeps subscribers. The effect is not TanStack-specific — it is every channel-based integration on bun (mysql, mysql2, other db and AI integrations), and it explains why bun db-span probes pass in small/short-lived apps and fail in a heavy vite/nitro bundle where GC actually runs.

## Workaround

Add to instrument.server.mjs, after Sentry.init (full file at .../verify4-M-tanstack-bun-dbspans/instrument.server.bun-fix.mjs):

  import diagnosticsChannel from 'node:diagnostics_channel';
  globalThis.__sentryKeepChannelsAlive = [
    'orchestrion:mysql:query',
    'orchestrion:mysql2:query',
    'orchestrion:mysql2:execute',
  ].map(name => diagnosticsChannel.tracingChannel(name));

then run the documented command with bun: `bun --preload ./.output/server/instrument.server.mjs .output/server/index.mjs`. Any strong reference works; keeping it on globalThis is what survives. Patching `dc.tracingChannel` from the preload does NOT work (v2-run-bun-keepall.log: "[v2] channels retained after init = 0") because the SDK's `import * as diagnosticsChannel` namespace does not see the patched property, so the channel names have to be listed. Real fix belongs in the SDK: retain the channel objects at the subscribe sites in packages/server-utils/src/integrations/* (or centrally for the Bun/Deno eager branch in packages/server-utils/src/orchestrion/instrumentation.ts), which would make this work with no user-side code.

## Docs impact

On the TanStack Start manual-setup page (~/dev/sentry-docs/docs/platforms/javascript/guides/tanstackstart-react/manual-setup/index.mdx, next to the start script at line 372): "On Bun, start the built server with `bun --preload ./.output/server/instrument.server.mjs .output/server/index.mjs`; because Bun drops `diagnostics_channel` subscriptions once the channel object is garbage collected, also keep a reference to the channels your database integrations use in `instrument.server.mjs` (for example `globalThis.__sentryKeepChannelsAlive = ['orchestrion:mysql:query', 'orchestrion:mysql2:query', 'orchestrion:mysql2:execute'].map(name => diagnosticsChannel.tracingChannel(name))`), otherwise database spans stop being recorded a few seconds after startup." The page needs no change for the build itself — `sentryTanstackStart()` in vite.config.ts builds fine with a database driver present; and the warning "No available Node API to register diagnostics-channel injection hooks" printed on Bun is a false alarm when the Vite plugin did the build-time injection, so the docs should not treat it as an error.
