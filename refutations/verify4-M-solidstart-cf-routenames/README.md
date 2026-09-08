# verify4-M-solidstart-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-solidstart-cf` (see `$REPRO/cells/M-solidstart-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RECIPE-middleware.ts`, `RECIPE-verified.md`, `app/`, `pack/`, `rawsink.log`, `rawsink.mjs`, `rawsink.pid`, `sink.log`, `sink.pid`, `sinkB.log`, `sinkB.pid`, `w1.log`, `w1.pid`, `w2.log`, `w2.pid`, `w3.log`, `w3.pid`, `w4.log`, `w4.pid`, `w5.log`, `w5.pid`, `wB-probe.log`, `wB-static.log`, `wB-stream-raw.log`, `wB-stream.log`, `wB.pid`, `wB2.pid`, `wB3.pid`, `wB4.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced the report exactly, then found no supported wiring that fixes it, only hand-written user code.

App: $SCRATCH/deep/verify4-M-solidstart-cf-routenames/app (SolidStart 1.3.2, vinxi 0.5.11, preset cloudflare-module, worker.mjs = Sentry.withSentry(...) around .output/server/index.mjs, wrangler 4.129.0 dev, compatibility_date 2026-05-01, nodejs_compat, @sentry/cloudflare 10.67.0 from $S/pack). node_modules was removed at the end; rerun with `npm install --no-audit --no-fund` in app/.

Rerun commands:
  PORT=52117 node $S/qs/sink.mjs > sinkB.log 2>&1 &
  (cd app && npx vinxi build && npx wrangler dev --config wrangler-static-b.jsonc --port 52118 --inspector-port 0)
  curl http://127.0.0.1:52118/api/users/42                          # baseline
  curl -H 'x-route-mw: router' http://127.0.0.1:52118/api/users/42   # middleware recipe
  curl -s http://127.0.0.1:52117/__items

1) Baseline (withSentry only, traceLifecycle 'static'), sink verbatim:
  {"type":"transaction","name":"GET /api/users/42","op":"http.server","source":"url","status":"ok","trace_id":"5e77d2837aef44e69f3e3b5afbb7db7c","sdk":"sentry.javascript.cloudflare","spans":[]}
  {"type":"transaction","name":"GET /api/sentinel","op":"http.server","source":"url","status":"ok","trace_id":"88060890255a41329da9918e5c0d0abc","sdk":"sentry.javascript.cloudflare","spans":[]}
The report's claim holds: raw path, source "url", one transaction name per id.

2) traceLifecycle 'stream' is not better, it is worse for grouping in the other direction, the name loses the path entirely:
  {"type":"span","trace_id":"ed784f5a2e20414c98d513cbee944d83","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
  raw attributes: {"sentry.op":"http.server","sentry.segment.name.source":"url","sentry.segment.name":"GET"}

3) Why nothing in the SDK can fix it today. @sentry/solidstart exports only ".", "./solidrouter", "./vite" (no /cloudflare), and its server SDK is initNodeSdk. @sentry/nitro does parameterize (packages/nitro/src/runtime/hooks/captureTracingEvents.ts:72 getParameterizedRoute reads event.context.matchedRoute.route) but that path is unreachable here twice over: it needs @sentry/node, and on this preset the h3 context has no matchedRoute at all. Probe route /api/probe/[id] on the running Worker returned:
  "nativeContextKeys": ["_platform","cf","cloudflare","nitro","waitUntil","_nitro","solidFetchEvent"],
  "matchedRoute": null, "nativeParams": null, "nativePath": "/api/probe/7",
  "rootSpanAttrs": {"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","sentry.segment.name.source":"url","url.path":"/api/probe/7", ...}
So even a straight port of the Nuxt/Nitro hook shape to @sentry/cloudflare would find nothing to read: SolidStart routes through its own router, and only its file-route table (vinxi/routes) or @solidjs/start's event.params carry the pattern.

4) What did work (user-land middleware, see workaround). Same app, header-gated so both paths are in one build. Static lifecycle, sink verbatim:
  {"type":"transaction","name":"GET /api/users/:id","op":"http.server","source":"route","status":"ok","trace_id":"4f6c0026031f4eff98c5c1812c7ad164","sdk":"sentry.javascript.cloudflare","spans":[]}
  {"type":"transaction","name":"GET /api/users/:id","op":"http.server","source":"route","status":"ok","trace_id":"9c485452bacd49fe928acfffb4d830a6","sdk":"sentry.javascript.cloudflare","spans":[]}
  {"type":"transaction","name":"GET /things/:slug","op":"http.server","source":"route","status":"ok","trace_id":"e4e38a8af9b041ed9ed9444a3cc19a7d","sdk":"sentry.javascript.cloudflare","spans":[]}
  {"type":"transaction","name":"GET /api/hello","op":"http.server","source":"route","status":"ok","trace_id":"f7d416b6c5a34cfe9ab266a501925369","sdk":"sentry.javascript.cloudflare","spans":[]}
Stream lifecycle, same build, raw span attributes:
  {"name":"GET /api/users/:id","is_segment":true,"attrs":{"sentry.op":"http.server","sentry.segment.name.source":"route","http.route":"/api/users/:id","sentry.segment.name":"GET /api/users/:id"}}
  {"name":"GET /things/:slug","is_segment":true,"attrs":{"sentry.op":"http.server","sentry.segment.name.source":"route","http.route":"/things/:slug","sentry.segment.name":"GET /things/:slug"}}
It covers API routes and SSR page routes, in both lifecycles, and sets http.route plus source "route".

5) Variants I tried and rejected:
- Deriving the pattern from event.params in onBeforeResponse instead of a route table: works for API routes ("GET /api/users/:id") but NOT for SSR page routes, params is empty there, so /things/xyz stayed {"name":"GET /things/xyz","source":"url"}. Do not document this variant.
- Renaming inside a single route handler works ({"name":"GET /api/manual/:id","source":"route"}) but obviously does not scale.
- Inlining @sentry/cloudflare instead of leaving it external in rollupConfig gives the middleware a second module instance, getActiveSpan() is undefined there and nothing renames. The external entry is load-bearing for the fix, not just for withSentry.

Not attempted, out of reach: @sentry/solidstart's own vite plugin / server entry cannot be used at all on workerd (it pulls @sentry/node), so there is no "different init placement" to test on the SDK side. Repo reference apps dev-packages/e2e-tests/test-applications/solidstart* are all Node/vinxi-node and assert Node-side nitro naming, none has a Cloudflare target.

Files: app/src/middleware.ts (both modes), app/src/routes/api/probe/[id].ts (context dump), app/wrangler-static-b.jsonc, app/wrangler-stream-b.jsonc, app/wrangler-stream-raw.jsonc, rawsink.mjs (span-attribute sink), RECIPE-verified.md, logs wB-static.log / wB-stream.log / wB-stream-raw.log / wB-probe.log, all under .../deep/verify4-M-solidstart-cf-routenames/.

## Workaround

Add a SolidStart middleware that matches the request path against the vinxi file-route table and renames the Cloudflare root span. Full text in .../deep/verify4-M-solidstart-cf-routenames/RECIPE-verified.md and app/src/middleware.ts.

app.config.ts:
  export default defineConfig({
    middleware: './src/middleware.ts',
    server: { preset: 'cloudflare-module', rollupConfig: { external: ['@sentry/cloudflare'] } },
  });

src/middleware.ts:
  import { createMiddleware } from '@solidjs/start/middleware';
  import { getActiveSpan, getRootSpan, spanToJSON, SENTRY_SEGMENT_NAME_SOURCE } from '@sentry/cloudflare';
  import { createRouter } from 'radix3';
  import fileRoutes from 'vinxi/routes';

  const normalize = (p) => p.replace(/\([^)/]+\)/g, '').replace(/\/+/g, '/').replace(/\*([^/]*)/g, (_m, m) => `**:${m}`);
  const router = createRouter({
    routes: fileRoutes.reduce((memo, r) => { const pattern = normalize(r.path) || '/'; memo[pattern] = { pattern }; return memo; }, {}),
  });

  export default createMiddleware({
    onRequest(event) {
      const match = router.lookup(new URL(event.request.url).pathname);
      if (!match?.pattern) return;
      const active = getActiveSpan();
      const root = active && getRootSpan(active);
      if (!root) return;
      const attrs = spanToJSON(root).attributes || {};
      if (attrs['sentry.op'] !== 'http.server') return;
      root.setAttribute('http.route', match.pattern);
      root.updateName(`${attrs['http.request.method'] || 'GET'} ${match.pattern}`);
      root.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route');
    },
  });

Constraints: @sentry/cloudflare must stay in rollupConfig.external (a second inlined copy breaks getActiveSpan in the middleware); radix3 comes in transitively with nitro, add it explicitly under strict hoisting; works in both traceLifecycle 'static' and 'stream'.

## Docs impact

A SolidStart guide page for Cloudflare Workers needs to say: "@sentry/solidstart's server SDK does not run on Cloudflare Workers; wrap the Nitro output with Sentry.withSentry from @sentry/cloudflare (keeping @sentry/cloudflare in server.rollupConfig.external) and use @sentry/solid for the browser. @sentry/cloudflare has no knowledge of the SolidStart router, so server transactions are named after the raw URL ('GET /api/users/42', source url) with traceLifecycle 'static' and after the method alone ('GET') with span streaming; to get '/api/users/:id' you must add a SolidStart middleware that looks the request path up in the vinxi/routes file-route table and calls span.updateName() plus setAttribute('sentry.segment.name.source', 'route') on the root span."
