# verify4-M-nuxt-deno-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-nuxt-deno` (see `$REPRO/cells/M-nuxt-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN-b.sh`, `RERUN.sh`, `app/`, `app-b.pid`, `app-c.pid`, `app-d.pid`, `app1.pid`, `app10.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `app5.pid`, `app6.pid`, `app7.pid`, `app8.pid`, `app9.pid`, `build-b.log`, `build-c.log`, `build-node.log`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `build7.log`, `build8.log`, `ctl.pid`, `install-b.log`, `install.log`, `install2.log`, `run-b.log`, `run-c.log`, `run-control.log`, `run-default.log`, `run-deno283.log`, `run-node.log`, `run-sentry.log`, `run-stream.log`, `run-variantB.log`, `run-variantC.log`, `run-variantF.log`, `run-variantG.log`, `run1.log`, `run2.log`, `sink-b.log`, `sink-b.pid`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Both halves of the claim are wrong.

(1) "No instrumentation path exists / injected nothing." The @sentry/nuxt build-time bundler plugin DOES instrument mysql2 inside the nitro rollup bundle, even for `deno_server`. Proof from the built output (no runtime hook involved, mysql2 is fully bundled):
  $ grep -oE "tracingChannel\('[^']+'\)" .output/server/chunks/_/db.mjs | sort -u
  tracingChannel('mysql2:connect')
  tracingChannel('mysql2:execute')
  tracingChannel('mysql2:pool:connect')
  tracingChannel('mysql2:query')
The runtime debug lines `[Sentry] Bundler plugin ran, injected libraries=[]` and `[Sentry] Runtime hook registered, injected libraries=[]` are MISLEADING: the bundler list is populated at build time in a different process and is always empty at runtime. The prior agent read those lines as the verdict; the bundle contradicts them. The app log also shows the channel integrations do subscribe on Deno: `[instrumentation:mysql2] Bun/Deno, subscribing eagerly`.

(2) "genFunc$1 is not a function / no db span reachable." Fixed by one nitro option, already present in the app under test:
  nitro: { preset: 'deno_server', externals: { inline: ['generate-function', 'named-placeholders'] } }
With that, /api/db returns 200 with real rows from MariaDB.

Sink evidence, deno_server preset, traceLifecycle 'static' (port 41352):
  {"type":"transaction","name":"manual-parent","op":"manual","source":"custom","status":"ok",
   "sdk":"sentry.javascript.nuxt","spans":["db mysql2.pool.connect","db SELECT id, name FROM users"]}

Same app, default lifecycle (stream, traceLifecycle line removed), port 41353:
  {"type":"span","trace_id":"025c66c6...","items":["db mysql2.pool.connect","db SELECT users","manual manual-parent"],
   "raw":[{"name":"SELECT users","status":"ok","parent_span_id":"b50b3bcbcacf1bb1","is_segment":false,
           "origin":"auto.db.mysql2.diagnostic_channel"}, ...]}
Low-cardinality name and correct origin, so the spans are genuine auto-instrumentation, not something the probe faked.

The one real limit on `deno_server`: the db subscriber is registered with `requiresParentSpan: true` (packages/server-utils/src/integrations/mysql2/mysql2-dc-subscriber.ts:125 and :146), and the `deno_server` output serves via `Deno.serve`, not `node:http`, so no `http.server` span exists to be that parent. A bare `/api/db` therefore returns 200 with zero span envelopes; only a handler wrapped in `Sentry.startSpan` gets db spans. Confirmed in the app log: for `/api/db` there is only `Patched h3 event handler. Using existing isolation scope.` and no `[Tracing] Starting sampled span`.

That limit disappears entirely with the `node-server` preset still run by `deno run` (port 41354, no code change, no manual span):
  {"type":"span","trace_id":"5b3bf407...","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET"],
   "raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.http_server"},
          {"name":"SELECT users","parent_span_id":"83a35a41fb874e0f","origin":"auto.db.mysql2.diagnostic_channel"}, ...]}
Each request also got its own trace id (5b3bf407 / bd510b7f / 7df3fe7d), and events carried request data and user IP, so this preset also fixes the reported "no server span at all" and shared-trace-id problems. It additionally fixes the reported SDK bug: with `node-server` the module correctly prepends `import './sentry.server.config.mjs';` to `.output/server/index.mjs`; only with `deno_server` does it write that line into a file literally named `.output/server/deno.json start`.

Not reproduced/side note: `mysql` (v2, the callback driver) gets no channel injection in this bundle and its handler 500s with `TypeError: SqlString.format is not a function` — a separate nitro-bundling defect, out of scope here.

Files (all absolute), $S = $SCRATCH:
  $S/deep/verify4-M-nuxt-deno-dbspans/RERUN-b.sh          both variants end to end
  $S/deep/verify4-M-nuxt-deno-dbspans/app/nuxt.config.ts   deno_server + externals.inline fix
  $S/deep/verify4-M-nuxt-deno-dbspans/app/server/db.ts     module-scope mysql2/promise pool
  $S/deep/verify4-M-nuxt-deno-dbspans/app/server/api/{db,dbspan,dbmysql,sentinel}.get.ts
  $S/deep/verify4-M-nuxt-deno-dbspans/build-b.log build-c.log build-node.log
  $S/deep/verify4-M-nuxt-deno-dbspans/run-b.log run-c.log run-node.log (app stdout, Sentry debug)
Commands: `npm install --no-audit --no-fund`; `npx nuxt build` (or `NITRO_PRESET=node-server npx nuxt build`); `PORT=47313 node $S/qs/sink.mjs`; `cd .output && PORT=<p> deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm --unstable-detect-cjs ./server/index.mjs`. All processes started were killed.

No Nuxt e2e app in the repo covers Deno (`dev-packages/e2e-tests/test-applications/nuxt-{3,4,5}` are node/cloudflare only), so nothing here is regression-tested.

## Workaround

Two things, both one line.

1. Make mysql2 runnable in the nitro bundle (fixes `genFunc$1 is not a function`), in nuxt.config.ts:
   nitro: { externals: { inline: ['generate-function', 'named-placeholders'] } }

2. Prefer `nitro: { preset: 'node-server' }` (or `NITRO_PRESET=node-server`) and run the output with `deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm --unstable-detect-cjs ./server/index.mjs`. Deno is still the runtime, but nitro serves over `node:http`, so you get `http.server` root spans, per-request traces, request data — and therefore db spans on ordinary route handlers with no code change. The SDK also injects `import './sentry.server.config.mjs';` into `.output/server/index.mjs` correctly with this preset.

If you must keep `preset: 'deno_server'`: db spans still work, but only inside an explicit `Sentry.startSpan(...)` in the handler, because `Deno.serve` produces no request span to parent them. You must also create the entry wrapper yourself, since the module writes the config import into a file named `.output/server/deno.json start`:
   printf "import './sentry.server.config.mjs';\nimport './index.mjs';\n" > .output/server/boot.mjs
   cd .output && deno run ... ./server/boot.mjs

## Docs impact

On the Nuxt guide's Deno/nitro page: "Database, AI and other library spans are instrumented at build time by the Sentry Nuxt module, so they work on Deno. Two things are required: add `nitro: { externals: { inline: ['generate-function', 'named-placeholders'] } }` to `nuxt.config.ts` so mysql2's `generate-function` dependency survives nitro's rollup bundling, and use the `node-server` preset rather than `deno_server` — you still run the output with `deno run`, but nitro then serves over `node:http`, which is what gives you `http.server` request spans; with `deno_server` the app is served by `Deno.serve`, no request span is created, and database spans (which are only recorded when a parent span is active) never appear unless you wrap the handler in `Sentry.startSpan()` yourself. Note also that with `autoInjectServerSentry: 'top-level-import'` and the `deno_server` preset the module writes the config import into a file named `.output/server/deno.json start` instead of the entry, so you must create your own wrapper entry that imports `./sentry.server.config.mjs` before `./index.mjs`. The runtime debug lines `[Sentry] Bundler plugin ran, injected libraries=[]` do not mean instrumentation is missing; that list is only populated during the build."
