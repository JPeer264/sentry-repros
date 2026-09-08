# verify4-M-express-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-express-cf` (see `$REPRO/cells/M-express-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO2.md`, `REPRO3.md`, `package-lock.json`, `package.json`, `rawB-stream.json`, `routes.js`, `routes2.js`, `routes3.js`, `routes4.js`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `sinkV.log`, `sinkV.pid`, `src/`, `srcA1/`, `srcA2/`, `srcA3/`, `srcB/`, `srcB2/`, `srcN1/`, `srcP1/`, `srcP2/`, `srcQ1/`, `srca/`, `srcc/`, `vite.config.B.mjs`, `vite.config.B2.mjs`, `vite.config.c.mjs`, `vite.config.mjs`, `viteB.log`, `viteB2.log`, `viteC.log`, `wA1.log`, `wA1.pid`, `wA2.log`, `wA2.pid`, `wA3.log`, `wA3.pid`, `wB-static.log`, `wB-stream.log`, `wB.pid`, `wB2-static.log`, `wB2s.pid`, `wBs.pid`, `wC.log`, `wC.pid`, `wN1.log`, `wN1.pid`, `wP1.log`, `wP1.pid`, `wP2.log`, `wP2.pid`, `wQ1.log`, `wQ1.pid`, `wa.pid`, `wrangler-a.log`, `wrangler.A1.jsonc`, `wrangler.A2.jsonc`, `wrangler.A3.jsonc`, `wrangler.B.jsonc`, `wrangler.B2.jsonc`, `wrangler.N1.jsonc`, `wrangler.P1.jsonc`, `wrangler.P2.jsonc`, `wrangler.Q1.jsonc`, `wrangler.a.jsonc`, `wrangler.c.jsonc`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Refuted. Express 5 on workerd gets parameterized route names in BOTH shapes; the reporter's Shape A gap disappears with one added line, and their "no sentry.source attribute" note is a mis-read of the span-v2 attribute name.

Probe dir: $SCRATCH/deep/verify4-M-express-cf-routenames (REPRO3.md has every command). Sink on 48733, workers on 48801-48805. wrangler 4.129.0, compatibility_date 2026-05-01, flags nodejs_compat + enable_nodejs_http_server_modules, express 5.2.1, @sentry/cloudflare 10.67.0 tarball from develop.

THE EXACT CHANGE (Shape A, plain `wrangler dev`, esbuild, NO vite plugin) - add two lines to the entry:

  import { patchExpressModule } from '@sentry/core/server';
  import expressMod from 'express';
  patchExpressModule(expressMod, () => ({}));   // before you build the app

srcP2/index.js, wrangler.P2.jsonc, traceLifecycle 'stream' (the develop default), port 48802:
  {"type":"span","items":["handler /users/:id","http.server GET /users/:id"],"raw":[{"name":"/users/:id","origin":"auto.http.express"},{"name":"GET /users/:id","is_segment":true,"origin":"auto.http.cloudflare"}]}
  {"type":"span","items":["router /api/orders","handler /api/orders/:orderId/items/:itemId","http.server GET /api/orders/:orderId/items/:itemId"]}
raw attributes on that http.server span:
  GET /users/:id | {"sentry.op":"http.server","sentry.segment.name.source":"route","http.route":"/users/:id","url.full":"http://127.0.0.1:48802/users/42",...}
  GET /api/orders/:orderId/items/:itemId | {"sentry.segment.name.source":"route","http.route":"/api/orders/:orderId/items/:itemId",...}

So the source attribute IS there and IS "route". The reporter looked for `sentry.source`; in span streaming the key is `sentry.segment.name.source` (the toolbox sink's compact mapping only reads `sentry.source`, which is why it looked absent). That sub-claim is refuted, not a bug.

NEGATIVE CONTROL (srcN1, same file minus the patch, stream, port 48805) - the win is entirely the patch:
  {"type":"span","items":["http.server GET"],"raw":[{"name":"GET","is_segment":true,"origin":"auto.http.cloudflare"}]}
  (method-only, i.e. worse than the reporter's static-lifecycle `GET /users/42`.)

RESIDUAL, the one real defect I found: `patchExpressModule` renames the root span ONLY under span streaming. srcP1 (same file, traceLifecycle 'static', port 48801) gets the handler spans but the transaction keeps the raw URL:
  {"type":"transaction","name":"GET /plain","source":"url","spans":["handler /plain"]}
  {"type":"transaction","name":"GET /users/42","source":"url","spans":["handler /users/:id"]}
  {"type":"transaction","name":"GET /api/orders/7/items/9","source":"url","spans":["router /:orderId/items/:itemId","handler /api/orders/:orderId/items/:itemId"]}
Cause, verified in source: packages/core/src/integrations/express/patch-layer.ts:318-346 `applyRouteToRootSpan` returns early on `!hasSpanStreamingEnabled(client)`. The channel-based path used by the vite plugin has no such guard - packages/server-utils/src/utils/setHttpServerSpanRouteAttribute.ts renames unconditionally - so the two Express instrumentation paths disagree. Note `patchExpressModule` is marked @deprecated ("will be removed in the next major version") yet it is the only Express instrumentation reachable without the bundler transform, since `expressIntegration()` in @sentry/server-utils only subscribes once orchestrion has injected the channels, and @sentry/cloudflare's default integration set pulls channel integrations from a global marker the vite plugin writes (packages/cloudflare/src/baseSdk.ts:37,70).

SHAPE B re-confirmed (vite build + sentryCloudflareVitePlugin(), lazy app, traceLifecycle 'static', port 48803) - route names with zero extra code:
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","spans":["handler /users/:id"]}
  {"type":"transaction","name":"GET /api/orders/:orderId/items/:itemId","source":"route","spans":["middleware router2","handler /api/orders/:orderId/items/:itemId"]}

Repo reference: there is no Express-on-Cloudflare e2e app in dev-packages/e2e-tests/test-applications, and nothing there uses `httpServerHandler` at all - the closest is cloudflare-orchestrion-mysql, which proves the vite-plugin channel path but not Express. So neither shape has e2e coverage.

## Workaround

Two, both verified on plain `wrangler dev` with no bundler plugin.

1) Full instrumentation (handler/router spans + route names), stream lifecycle only. In the entry, before building the app:
   import { patchExpressModule } from '@sentry/core/server';
   import expressMod from 'express';
   patchExpressModule(expressMod, () => ({}));
Keep the default `traceLifecycle: 'stream'`; under 'static' this renames nothing.

2) Route names only, works under 'static' (and needs no deprecated API). A global middleware that patches res.end so it runs after routing resolved req.route but before the root span closes (routes4.js in the probe dir):
   app.use((req, res, next) => {
     const originalEnd = res.end;
     res.end = function (...args) {
       const root = Sentry.getActiveSpan() && Sentry.getRootSpan(Sentry.getActiveSpan());
       const routePath = req.route?.path;
       if (root && routePath) {
         const route = `${req.baseUrl || ''}${routePath}`;
         Sentry.updateSpanName(root, `${req.method} ${route}`);
         root.setAttribute('http.route', route);
         root.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route'); // from @sentry/conventions/attributes
       }
       return originalEnd.apply(this, args);
     };
     next();
   });
Verified (srcQ1, port 48804, static): {"type":"transaction","name":"GET /users/:id","source":"route"} and {"name":"GET /api/orders/:orderId/items/:itemId","source":"route"}.

3) Or just use the Vite plugin shape, which needs no app-side code at all.

## Docs impact

The Cloudflare guide has no page on running a Node HTTP framework behind `httpServerHandler` from `cloudflare:node` - `httpServerHandler` appears nowhere under ~/dev/sentry-docs, and `patchExpressModule` appears nowhere either. Add to docs/platforms/javascript/guides/cloudflare/features/nodejs-compat.mdx: "Express, Koa and other Node HTTP frameworks running behind `httpServerHandler` are only instrumented when the code transform is active. With the Vite plugin (`sentryCloudflareVitePlugin()`, `buildTimeInstrumentation` on by default) you get framework spans and parameterized transaction names (`GET /users/:id`, `source: route`) automatically. Building with plain `wrangler dev`/esbuild instead gives no transform: the server span is then named after the raw URL under `traceLifecycle: 'static'` or after the method alone under `'stream'`. In that setup call `patchExpressModule(express, () => ({}))` from `@sentry/core/server` before creating the app - note it only renames the server span when span streaming is enabled."
