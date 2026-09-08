# verify4-M-elysia-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-elysia-cf` (see `$REPRO/cells/M-elysia-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `build1.log`, `install.log`, `package-lock.json`, `package.json`, `sink.log`, `sink.pid`, `src/`, `tsconfig.json`, `vite.config.mjs`, `vite.config.ts`, `vite.control.config.ts`, `w1.pid`, `w2.pid`, `w3.pid`, `w4.pid`, `wA.log`, `wA.pid`, `wB.log`, `wB.pid`, `wC.log`, `wC.pid`, `wr1.log`, `wr2.log`, `wr3.log`, `wr4.log`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The exact change that fixes it: build the Worker with Vite + `sentryCloudflareVitePlugin()` instead of letting `wrangler dev` bundle `src/index.ts` with its own esbuild. Nothing in the app code had to change. The plugin's `buildTimeInstrumentation` (default true) injects `diagnostics_channel.tracingChannel` calls into the bundled `mysql2` and registers the Sentry subscriber factory; plain wrangler/esbuild does not, which is why the original probe saw `spans: []`.

Probe dir: $SCRATCH/deep/verify4-M-elysia-cf-dbspans/
  src/index.ts        withElysia(new Elysia({ aot: false })) + module-scope mysql2 pool (disableEval: true) + Sentry.withSentry
  vite.config.mjs     plugins: [cloudflare(), sentryCloudflareVitePlugin()]
  wrangler.jsonc      compatibility_date 2026-05-01, compatibility_flags ["nodejs_compat"], vars SINK_PORT/TRACE_LIFECYCLE
  build1.log, wA.log (static), wB.log (stream), wC.log (plain-wrangler control)

Commands (node_modules was removed at the end; reinstall first):
  S=$SCRATCH
  npm install elysia@1.4.30 mysql2 vite@6 @cloudflare/vite-plugin wrangler@4 \
    $REPRO/_toolbox/pack/sentry-{cloudflare,core,opentelemetry,server-utils,elysia,bun,node,server-runtime-injection}-10.67.0.tgz
  PORT=41337 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &
  npx vite build
  npx wrangler dev --config dist/v4_elysia_cf_db/wrangler.json --port 41338 --inspector-port 0
  curl -s http://127.0.0.1:41338/db ; curl -s http://127.0.0.1:41338/sentinel
Versions: wrangler 4.129.0, workerd 1.20260903.1, vite 6.4.3, @cloudflare/vite-plugin 1.54.x, elysia 1.4.30, mysql2 3.24.3, SDK 10.67.0 (develop tarballs).

Evidence, traceLifecycle 'static' (vite build, wA.log run):
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"4b360225c5b24b739902426f43ad3a83","sdk":"sentry.javascript.cloudflare","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","spans":[]}

Evidence, traceLifecycle 'stream' (same build, --var TRACE_LIFECYCLE:stream, wB.log run):
{"type":"span","trace_id":"2c038c9dab844a6c8bde53d92065861b","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET /db"],"raw":[{"name":"mysql2.pool.connect","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"mysql2.connect","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"SELECT users","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"GET /db","is_segment":true,"origin":"auto.http.cloudflare"}]}

Control, same src/index.ts run by plain `npx wrangler dev --config wrangler.jsonc --port 41340` (wC.log) reproduces the original report exactly:
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"b426a0149c8144ad8f5774b73291848d","sdk":"sentry.javascript.cloudflare","spans":[]}

Channel injection is verifiable in the artifact: `grep -c "orchestrion:mysql2" dist/v4_elysia_cf_db/assets/worker-entry-*.js` -> 2 (0 in the plain-wrangler bundle).

Two side findings that also contradict parts of the original report:
- `withElysia` from @sentry/elysia bundles cleanly under Vite/rollup as well as esbuild (1801 modules, no externals, no errors), and it fixes transaction naming: `GET /users/:id` with `source: "route"` on BOTH the Vite and the plain-wrangler builds, where the plain-withSentry fallback reported `source: "url"`.
- Both trace lifecycles work; the report's `spans: []` was purely a build-pipeline artifact, not a lifecycle or Elysia issue.

Still true from the original report and required: `new Elysia({ aot: false })` (aot on still refuses to start the Worker) and `disableEval: true` on the mysql2 pool. The pool must stay at module scope.

Reference cross-check: the repo's own e2e app dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql uses exactly this vite.config.ts (`plugins: [cloudflare(), sentryCloudflareVitePlugin()]`), so the working path is the one the SDK already tests, just never shown for Elysia.

## Workaround

Build the Worker with Vite instead of letting wrangler bundle the entry: add `vite.config.mjs` with `plugins: [cloudflare(), sentryCloudflareVitePlugin()]` (from `@sentry/cloudflare/vite`), run `npx vite build`, then `npx wrangler dev --config dist/<worker-name>/wrangler.json`. No application-code change is needed; keep `new Elysia({ aot: false })`, the module-scope `mysql.createPool({ ..., disableEval: true })`, and `Sentry.withSentry(...)` around `{ fetch: request => app.fetch(request) }`.

## Docs impact

On Cloudflare Workers, database spans (for example `mysql2`) are only emitted when the Worker is built with Vite and `sentryCloudflareVitePlugin()` from `@sentry/cloudflare/vite`, whose `buildTimeInstrumentation` injects the tracing channels into your bundled dependencies; a Worker bundled by `wrangler dev`/`wrangler deploy` alone produces the request span but no database spans, and on workerd the mysql2 pool must be created at module scope with `disableEval: true` while Elysia must be constructed as `new Elysia({ aot: false })` (wrap it with `withElysia` from `@sentry/elysia` before registering routes to also get parameterized transaction names, but do not call that package's `init` - `Sentry.withSentry` from `@sentry/cloudflare` supplies the client).
