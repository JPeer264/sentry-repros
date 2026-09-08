# verify4-M-oak-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-oak-cf` (see `$REPRO/cells/M-oak-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `.npmrc`, `package-lock.json`, `package.json`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sink2.pid`, `src/`, `wr.pid`, `wr2.pid`, `wr3.pid`, `wrangler-static.log`, `wrangler-stream.log`, `wrangler-stream2.log`, `wrangler-stream3.log`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Probe dir: $SCRATCH/deep/verify4-M-oak-cf-routenames/ (src/index.ts has three modes selected by a `?mode=` query param: `off` = no middleware, `after` = the previously reported middleware verbatim, `fixed` = my corrected one; wrangler.jsonc, sink.mjs, wrangler-static.log, wrangler-stream3.log). Oak 17.2.0 via npm:@jsr/oak__oak, wrangler 4.129.0, compatibility_date 2026-05-01, nodejs_compat, @sentry/cloudflare 10.67.0 tarball, tunnel to a local sink.

Rerun: `npm install '@oak/oak@npm:@jsr/oak__oak@17.2.0' wrangler@4 $REPRO/_toolbox/pack/sentry-{cloudflare,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz` with `@jsr:registry=https://npm.jsr.io` in .npmrc, then `PORT=52413 node sink.mjs &` and `npx wrangler dev --port 52414 --inspector-port 0` (static, from wrangler.jsonc vars) plus `npx wrangler dev --port 52481 --inspector-port 0 --var SENTRY_LIFECYCLE:stream` (stream).

CONFIRMED (the out-of-box half): there is no Oak support anywhere on develop. `grep -rni oak` over packages/cloudflare/src and packages/server-runtime-injection/src finds nothing, there is no dev-packages/e2e-tests/test-applications app for Oak, and no ~/dev/sentry-docs/docs/platforms/javascript/guides/oak. With no middleware the segment name comes from wrapRequestHandlerWithInit's `getHttpSpanDetailsFromUrlObject`, so:
  static: {"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"d80144d2a6b74d40a9cd88636cd3c92f","sdk":"sentry.javascript.cloudflare","spans":[]}
  stream: {"type":"span","items":["http.server GET"],"raw":[{"name":"GET","is_segment":true,"origin":"auto.http.cloudflare","segsource":"url"}]}

REFUTED (both specific defects in the report):

1. "route source only in stream, custom in static" is a bug in the reported snippet, not the SDK. `SENTRY_SEGMENT_NAME_SOURCE` is `'sentry.segment.name.source'` (packages/core/src/index.ts:13, re-exported by packages/cloudflare/src/index.ts:91), and that is the key both lifecycles read: packages/core/src/tracing/sentrySpan.ts:451 `const source = this._attributes[SENTRY_SEGMENT_NAME_SOURCE];`. The snippet wrote the legacy `'sentry.source'`, which the SDK ignores, so `updateSpanName`'s own `INTERNAL_setSegmentNameSourceIfSegment(span, 'custom')` (packages/core/src/utils/spanUtils.ts:492-498) stood in both lifecycles. The "route" the reporter saw in stream was their own raw attribute echoed back, not the segment name source. My sink prints both keys and shows exactly that for mode=after:
  static: {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"custom",...}
  stream: {"type":"span","items":["http.server GET /users/:id"],"raw":[{"name":"GET /users/:id","is_segment":true,"source":"route","segsource":"custom"}]}
Setting `Sentry.SENTRY_SEGMENT_NAME_SOURCE` instead gives `route` in both.

2. "never runs on the error path" is fixed by `try { await next(); } finally { ... }`. Oak rethrows out of `Application.fetch`, and the middleware's finally unwinds before wrapRequestHandlerWithInit's own catch, so the rename lands.

Working middleware, registered before `router.routes()`:
  app.use(async (ctx, next) => {
    try {
      await next();
    } finally {
      const path = ctx.matched?.[ctx.matched.length - 1]?.path;
      const span = Sentry.getActiveSpan();
      if (path && span) {
        const root = Sentry.getRootSpan(span);
        const routeName = `${ctx.request.method} ${path}`;
        Sentry.updateSpanName(root, routeName);
        root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
        root.setAttribute('http.route', path);
        Sentry.getIsolationScope().setTransactionName(routeName);
      }
    }
  });

Result with it (mode=fixed), same worker, both lifecycles, success and error routes:
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route",...}
  {"type":"transaction","name":"GET /error/:id","op":"http.server","source":"route",...}
  {"type":"span","items":["http.server GET /users/:id"],"raw":[{"name":"GET /users/:id","is_segment":true,"origin":"auto.http.cloudflare","segsource":"route"}]}
  {"type":"span","items":["http.server GET /error/:id"],"raw":[{"name":"GET /error/:id","is_segment":true,"origin":"auto.http.cloudflare","segsource":"route"}]}
  {"type":"event","transaction":"GET /error/:id","exception":"Error: oak-route-boom","url":"http://127.0.0.1:52481/error/7?mode=fixed"}

The `getIsolationScope().setTransactionName(routeName)` line is what puts `transaction: "GET /error/:id"` on the error event; without it the event has no transaction field in either lifecycle (that was also true of the baseline and of the reported snippet). This mirrors what the Hono integration does at packages/hono/src/shared/middlewareHandlers.ts:102-117 (`updateSpanName` + `INTERNAL_setSegmentNameSourceIfSegment(rootSpan, 'route')` + `HTTP_ROUTE` + `isolationScope.setTransactionName`), which is the reference shape for a framework with no Sentry integration.

Other variants tried and found not to matter: entry shape (`app.fetch` passed straight to `withSentry` is already the documented Oak Cloudflare handler, application.js:287-302), init placement, and both trace lifecycles. No bundler variant is needed, and the Vite plugin changes nothing here because the naming happens at span start inside wrapRequestHandlerWithInit, not at build time.

Not fixed by the middleware and worth a separate look: the transaction/segment status stays `"ok"` on the 500 error route in both lifecycles.

All processes I started were killed; node_modules left in place so the probe is rerunnable.

## Workaround

Register one Oak middleware before `router.routes()` that renames the root span in a `finally` block and sets the segment name source with the exported constant, not the legacy `sentry.source` string:

app.use(async (ctx, next) => {
  try {
    await next();
  } finally {
    const path = ctx.matched?.[ctx.matched.length - 1]?.path;
    const span = Sentry.getActiveSpan();
    if (path && span) {
      const root = Sentry.getRootSpan(span);
      const routeName = `${ctx.request.method} ${path}`;
      Sentry.updateSpanName(root, routeName);
      root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
      root.setAttribute('http.route', path);
      Sentry.getIsolationScope().setTransactionName(routeName);
    }
  }
});

This yields `GET /users/:id` with source `route` under both `traceLifecycle: 'static'` and `'stream'`, and it also runs on the throwing route, which the `await next()`-then-rename form does not.

## Docs impact

Oak has no Sentry integration, so `withSentry` alone names the request span after the raw URL (`GET /users/42`, source `url`) with `traceLifecycle: 'static'` and after the method alone (`GET`) with the default `'stream'`; to get parameterized names, register one Oak middleware before `router.routes()` that reads `ctx.matched` inside a `try/finally` (so it also runs when a handler throws) and calls `Sentry.updateSpanName(Sentry.getRootSpan(span), routeName)`, `rootSpan.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route')` — the exported constant, not the string `'sentry.source'`, which the SDK ignores — plus `Sentry.getIsolationScope().setTransactionName(routeName)` so error events carry the route too.
