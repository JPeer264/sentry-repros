# verify4-M-nuxt-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-nuxt-cf` (see `$REPRO/cells/M-nuxt-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `buildA.log`, `buildB.log`, `buildC.log`, `buildD.log`, `sink.log`, `sink.pid`, `sinkB.log`, `updateRouteBeforeResponse.orig.js`, `w1.log`, `w1.pid`, `w2.log`, `w2.pid`, `w3.log`, `w3.pid`, `w4.log`, `w4.pid`, `wA.log`, `wA.pid`, `wB.log`, `wB.pid`, `wC.log`, `wC.pid`, `wD.log`, `wD.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Could not refute. Reproduced end to end and the reported defect stands exactly as described: on Nuxt 4.2 + nitro `cloudflare_module` + `@sentry/nuxt` develop (10.67.0), a NON-parameterized Nitro server route gets no `http.route` and no route-sourced segment name. Parameterized routes are correct.

App: $SCRATCH/deep/verify4-M-nuxt-cf-routenames/app (nuxt.config.ts, wrangler.jsonc, server/plugins/sentry.ts, server/plugins/route-name.ts, server/api/{db,log,sentinel,users/[id]}.ts). node_modules removed after the run.

Install: npm install --no-audit --no-fund nuxt@^4.1.2 wrangler@^4 $S/pack/sentry-{nuxt,cloudflare,core,node,vue,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry,bundler-plugins}-10.67.0.tgz
Run: npx nuxt build && npx wrangler dev --port 41791 --inspector-port 0 ; sink: PORT=41777 node $S/qs/sink.mjs

RUN A - stream (default lifecycle), stock SDK, no extra plugin. Sink `span` items:
{"type":"span","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}     <- GET /api/db
{"type":"span","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}     <- GET /api/log
{"type":"span","items":["http.server GET /api/users/:id"],"raw":[{"name":"GET /api/users/:id","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","items":["http.server GET"],...}                                                                                        <- GET /api/sentinel
So under `stream` three of four routes collapse to the method-only segment `http.server GET`.

RUN D - static lifecycle, stock SDK. Transaction envelopes:
{"name":"GET /api/db","src":"url"}
{"name":"GET /api/users/:id","src":"route","route":"/api/users/:id","pid":"42"}
{"name":"GET /api/sentinel","src":"url"}
Static keeps a usable URL-derived name but still has no `http.route` and `transaction_info.source: "url"`.

Root cause confirmed in source, not inferred: packages/nuxt/src/module.ts:105-121 registers `route-detector.server` and `update-route-name.server` only when a `sentry.server.config.*` file exists (the Node path). The Cloudflare path has no server config file, so the only route source is `nitroApp.hooks.hook('beforeResponse', updateRouteBeforeResponse)` in packages/nuxt/src/runtime/plugins/sentry-cloudflare.server.ts:103. That hook (packages/nuxt/src/runtime/hooks/updateRouteBeforeResponse.ts:26) gates on
  if (matchedRoutePath && matchedRoutePath !== requestPath) {
so it calls `setHttpServerSpanRouteAttribute` only when the matched route differs from the request path, i.e. only for parameterized routes. `event.context.matchedRoute` IS populated for plain routes - I echoed it from the handler: GET /api/db returned `"matchedRoute":{"path":"/api/db","handlers":{}}`. Only the `!==` comparison suppresses it.

Refutation attempts that all failed to fix it:
- Documented wiring is already what I ran: ~/dev/sentry-docs/platform-includes/getting-started-complete/javascript.nuxt.mdx:287-292 shows exactly this `server/plugins/sentry.ts` with `sentryCloudflareNitroPlugin({ dsn, tracesSampleRate })`. No route-related option is documented or exists.
- Other trace lifecycle: RUN D above. `static` masks the severity but does not set `http.route` or `source: route`.
- Module/init options: `SentryNuxtModuleOptions` (packages/nuxt/src/common/types.ts) has no route/naming toggle; grep for "route" in that file returns nothing.
- Adding a `sentry.server.config.ts` to make `module.ts` register `update-route-name.server` / `route-detector.server` would not help - `update-route-name.server` calls the same `updateRouteBeforeResponse` with the same guard, and `route-detector.server` only handles the SSR page catch-all (`/**`), not `server/api/*`.
- Repo e2e reference `dev-packages/e2e-tests/test-applications/nuxt-4-cloudflare` uses this identical wiring and has only `tests/db.test.ts` - no route-name coverage at all, which is why this is unguarded.
- Bundler variant: none applies. `@sentry/nuxt/module` pushes `sentryOrchestrionPlugin` into the Nitro rollup config itself for `cloudflare*` presets, so there is no alternative build path to try.

RUN C - proof the fix is a one-line SDK change. I patched only the built hook in node_modules (`@sentry/nuxt/build/module/runtime/hooks/updateRouteBeforeResponse.js`), replacing `if (matchedRoutePath && matchedRoutePath !== requestPath)` with `if (matchedRoutePath)` (the `/**` early return kept), user plugin disabled, stream lifecycle. Segment attributes:
{"name":"GET /api/db","route":"/api/db","src":"route","path":"/api/db"}
{"name":"GET /api/log","route":"/api/log","src":"route","path":"/api/log"}
{"name":"GET /api/users/:id","route":"/api/users/:id","src":"route","pid":"42","path":"/api/users/42"}
{"name":"GET /api/sentinel","route":"/api/sentinel","src":"route","path":"/api/sentinel"}
No regression on the parameterized route, and the SSR page `/` still falls through the `/**` early return.

## Workaround

Add a second Nitro plugin next to the Sentry one that sets the route unconditionally. Verified working (RUN B, stream lifecycle, stock SDK) - file at .../verify4-M-nuxt-cf-routenames/app/server/plugins/route-name.ts:

import { defineNitroPlugin } from '#imports';
import { getActiveSpan, getRootSpan, spanToJSON } from '@sentry/cloudflare';

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('beforeResponse', (event: any) => {
    const route = event.context?.matchedRoute?.path ?? event.context?.matchedRoute?.route;
    if (!route || route === '/**') return;
    const activeSpan = getActiveSpan();
    if (!activeSpan) return;
    const rootSpan = getRootSpan(activeSpan);
    if (!rootSpan) return;
    const attrs = spanToJSON(rootSpan).attributes ?? {};
    if (attrs['sentry.op'] !== 'http.server') return;
    if (attrs['http.route']) return;
    const method = attrs['http.request.method'] ?? attrs['http.method'] ?? 'GET';
    rootSpan.setAttribute('http.route', route);
    rootSpan.updateName(`${method} ${route}`);
    rootSpan.setAttribute('sentry.segment.name.source', 'route');
  });
});

Result with it in place (stream, unpatched SDK):
{"name":"GET /api/db","route":"/api/db","src":"route"}
{"name":"GET /api/log","route":"/api/log","src":"route"}
{"name":"GET /api/users/:id","route":"/api/users/:id","src":"route","pid":"42"}
{"name":"GET /api/sentinel","route":"/api/sentinel","src":"route"}
It only fills in what the SDK left empty (the `http.route` guard), so it is safe to keep after the SDK is fixed. `@sentry/server-utils` also exports `setHttpServerSpanRouteAttribute` from its main entry and is already a dependency of `@sentry/nuxt`, but it is an internal package and pulls Node-only instrumentation into a workerd bundle, so the `@sentry/cloudflare`-only form above is the one to publish.

Proper fix: drop the `matchedRoutePath !== requestPath` comparison in packages/nuxt/src/runtime/hooks/updateRouteBeforeResponse.ts:26 and keep only the `/**` early return. The param-attribute loop below it is already a no-op when `event.context.params` is absent.

## Docs impact

On the Nuxt Cloudflare page (platform-includes/getting-started-complete/javascript.nuxt.mdx, the `sentryCloudflareNitroPlugin` section around line 287): "On the Cloudflare presets, only parameterized server routes such as `server/api/users/[id].ts` are reported with their route pattern. A server route with no parameters gets no `http.route` attribute, so with the default `traceLifecycle: 'stream'` its span is named by HTTP method only (`GET`), and with `traceLifecycle: 'static'` its transaction keeps the URL-derived name with `source: \"url\"`. Until this is fixed, add a Nitro plugin that hooks `beforeResponse` and sets `http.route` from `event.context.matchedRoute.path` on the root span."
