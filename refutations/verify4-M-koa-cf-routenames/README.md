# verify4-M-koa-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-koa-cf` (see `$REPRO/cells/M-koa-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO.md`, `app.js`, `dump.py`, `package-lock.json`, `package.json`, `rawB-stream.json`, `routes.js`, `sink.log`, `sink.pid`, `src/`, `srcA/`, `srcB/`, `srcc/`, `vite.config.A.mjs`, `vite.config.b.mjs`, `vite.config.c.mjs`, `viteA.log`, `viteb.log`, `vitec.log`, `vitec2.log`, `wA-stream.log`, `wB-static.log`, `wB-stream.log`, `wBs.pid`, `wC.log`, `wD.log`, `wa.pid`, `wb.pid`, `wc.pid`, `wd.pid`, `we.pid`, `wrangler-a.log`, `wrangler-b.log`, `wrangler-c.log`, `wrangler-d.log`, `wrangler-e.log`, `wrangler.A.jsonc`, `wrangler.b.jsonc`, `wrangler.c.jsonc`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Koa 3.2.1 + @koa/router 15.7.0 on Cloudflare Workers DOES produce parameterized route names with @sentry/cloudflare 10.67.0 from develop, in both trace lifecycles. Two things are needed together, and the original probe had exactly one of them wrong.

(1) Build through Vite with `sentryCloudflareVitePlugin()` (defaults are fine: `autoInstrumentation: true`, `buildTimeInstrumentation: true`). Its orchestrion transform injects `orchestrion:koa:use` / `orchestrion:koa:callback` diagnostics channels into the bundled `koa/lib/application.js` and registers the Koa channel-subscriber factory on `globalThis.__SENTRY_ORCHESTRION__`, which `withSentry` picks up: `Sentry Logger [log]: Integration installed: Koa` (wrangler-e.log). Plain `wrangler dev` on the raw entry (esbuild, no plugin) does no injection, so there is nothing that can ever know the matched route - that is the reported baseline, which I reproduced exactly.

(2) Build the Koa app INSIDE the fetch handler, not at module scope. This is why the reporter concluded the plugin "no longer boots". The exact workerd error from my reproduction (wrangler-b.log, module-scope `buildApp().listen(8080)` + plugin):
  service core:user:koa-cf-b: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
    at index.js:54321:34 in use
    at index.js:57078:7 in buildApp
The frame at index.js:54321 is the injected `return tr_ch_apm$use.start.runStores(__apm$ctx, () => {...})` inside `Application.use` - i.e. the *instrumented* `app.use()` is the disallowed global-scope operation, not `app.listen()`. Un-instrumented `app.use()` at module scope boots fine (variant A). Moving app construction into the handler removes the failure completely. This mirrors the comment in the repo's own e2e app dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql/src/index.ts ("The connection is created inside the handler: workerd forbids I/O in global scope"); there is no Koa+Cloudflare e2e app to copy from.

BASELINE (variant A, plain `wrangler dev`, module-scope app) - reproduces the report:
  {"type": "span", "items": ["http.server GET"], "raw": [{"name": "GET", "is_segment": true, "origin": "auto.http.cloudflare"}]}

FIXED (variant C, Vite + plugin, lazy app, stream lifecycle) - `curl /users/42`, `/api/orders/7/items/9`:
  {"type": "span", "items": ["router /users/:id", "http.server GET /users/:id"], "raw": [{"name": "/users/:id", "parent_span_id": "886c308acf18432d", "is_segment": false, "origin": "auto.http.koa"}, {"name": "GET /users/:id", "is_segment": true, "origin": "auto.http.cloudflare"}]}
  {"type": "span", "items": ["router /api/orders/:orderId/items/:itemId", "http.server GET /api/orders/:orderId/items/:itemId"], ...}
Segment attributes (dump.py over /__items?raw):
  {"name": "GET /users/:id", "is_segment": true, "op": "http.server", "http.route": "/users/:id", "source": "route", "origin": "auto.http.cloudflare"}
  {"name": "GET /api/orders/:orderId/items/:itemId", "is_segment": true, "op": "http.server", "http.route": "/api/orders/:orderId/items/:itemId", "source": "route", "origin": "auto.http.cloudflare"}
So `sentry.segment.name.source = "route"` and `http.route` are both set on the segment, plus a nested `router` child span with `origin: auto.http.koa` and its own `http.route`, `koa.name`, `koa.type` attributes.

STATIC lifecycle (same build, `--var LIFECYCLE:static`):
  {"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "spans": ["router /users/:id"]}
  {"type": "transaction", "name": "GET /api/orders/:orderId/items/:itemId", "op": "http.server", "source": "route", "spans": ["router /api/orders/:orderId/items/:itemId"]}
No high-cardinality URL naming left in either lifecycle.

Errors keep working with this wiring (`app.on('error', ...)` still required):
  {"type": "event", "exception": "Error: koa-cf boom", "mechanism": "koa.onerror", "handled": false, "transaction": "GET /boom/:id", "sdk": "sentry.javascript.cloudflare"}
  {"type": "span", "items": ["router /boom/:id", "http.server GET /boom/:id"], "raw": [{"name": "/boom/:id", "status": "error", ...}, {"name": "GET /boom/:id", "status": "error", "is_segment": true}]}
so the error event's `transaction` is the route now, not the raw path.

The manual `Sentry.updateSpanName(getRootSpan(...))` workaround still works and still wins (source `custom`) but is no longer needed.

Files (all under $S/deep/verify4-M-koa-cf-routenames/, node_modules removed after the run):
- $SCRATCH/deep/verify4-M-koa-cf-routenames/app.js - shared Koa app (`buildApp()` factory, routes /plain, /users/:id, /api/orders/:orderId/items/:itemId, /named/:id manual-naming, /boom/:id, /sentinel)
- .../src/index.js + wrangler.jsonc - variant A, module-scope app, plain wrangler (baseline, no route names)
- .../src/index.js + wrangler.b.jsonc + vite.config.b.mjs - variant B, module-scope app + Vite plugin (the boot failure; log in wrangler-b.log)
- .../srcc/index.js + wrangler.c.jsonc + vite.config.c.mjs - variant C, lazy app + Vite plugin (WORKS; logs wrangler-c.log stream, wrangler-d.log static, wrangler-e.log errors)
- .../dump.py - prints name/op/http.route/source per span from the sink's raw feed

Rerun:
  npm install koa@3 @koa/router wrangler@4 vite@6 @cloudflare/vite-plugin $S/pack/sentry-{cloudflare,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz
  PORT=51733 node $S/qs/sink.mjs > sink.log 2>&1 &
  npx vite build --config vite.config.c.mjs
  npx wrangler dev --config distc/koa_cf_c/wrangler.json --port 51736 --inspector-port 0    # add --var LIFECYCLE:static for transactions
  curl -s http://127.0.0.1:51736/users/42 ; python3 dump.py "http://127.0.0.1:51733/__items?raw"
wrangler 4.129.0 / workerd 1.20260903.1, compatibility_date 2026-05-01, flags nodejs_compat + enable_nodejs_http_server_modules.

## Workaround

Not needed any more for route names. The working wiring: build the Worker with Vite (`plugins: [cloudflare(), sentryCloudflareVitePlugin()]`) and create the Koa app lazily inside the fetch handler instead of at module scope:

  import { httpServerHandler } from 'cloudflare:node';
  import * as Sentry from '@sentry/cloudflare';
  import { buildApp } from '../app.js';   // returns a NEW Koa app, does not listen

  let listening;
  const ensureApp = () => (listening ??= new Promise(r => buildApp().listen(8080, r)));
  const inner = httpServerHandler({ port: 8080 });

  export default Sentry.withSentry(
    env => ({ dsn: '...', tracesSampleRate: 1.0 }),
    { async fetch(request, env, ctx) { await ensureApp(); return inner.fetch(request, env, ctx); } },
  );

`app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } }))` is still required for error events. The old manual naming (`Sentry.updateSpanName(Sentry.getRootSpan(Sentry.getActiveSpan()), `${ctx.method} ${ctx._matchedRoute}`)`) remains the only option if you cannot build through Vite, e.g. a plain `wrangler dev`/esbuild pipeline, since nothing injects the Koa channels there.

## Docs impact

On Cloudflare Workers, `@koa/router` route names (`GET /users/:id`, `http.route`, source `route`) require building the Worker through Vite with `sentryCloudflareVitePlugin()`, which injects the Koa diagnostics channels at build time; and because the instrumented `app.use()` performs a disallowed operation in Worker global scope, the Koa app must be created inside the fetch handler (lazily, guarded by a module-level promise) rather than at module scope, otherwise the Worker fails to start with "Disallowed operation called within global scope".
