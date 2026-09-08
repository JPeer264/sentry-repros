# verify4-M-solidstart-bun-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-solidstart-bun` (see `$REPRO/cells/M-solidstart-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app.pid`, `app1.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `app5.pid`, `app6.pid`, `appnode.pid`, `build.log`, `build2.log`, `build3.log`, `build4.log`, `buildA.log`, `install.log`, `r1-bun-static-baseline.log`, `r2-bun-static-routefix.log`, `r3-bun-stream-baseline.log`, `r4-bun-stream-routefix.log`, `r5-node-static-baseline.log`, `r6-node-static-routefix.log`, `run-bun-fix-static.log`, `run-bun-fix2-static.log`, `run-bun-fix2-stream.log`, `run-bun-nitroroute.log`, `run-bun-static.log`, `run-bun-static2.log`, `run-node-fix-static.log`, `run-node-static.log`, `sink-v.log`, `sink.log`, `sink.mjs`, `sink.pid`, `sinkv.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Confirmed, and root-caused: the SDK never parameterizes SolidStart 2 file routes, on bun 1.4.0 and on node 26 alike. This is not a bun defect and not an SDK defect in the nitro instrumentation itself.

Setup (all in $SCRATCH/deep/verify4-M-solidstart-bun-routenames/app): the repo's own `dev-packages/e2e-tests/test-applications/solidstart-2` app, docs-shaped wiring (`solidStart()` + `sentrySolidStart()` + `nitro({ serverDir: './server' })`, `Sentry.init` in `server/plugins/sentry.ts`, `sentryBeforeResponseMiddleware()` in `src/middleware.ts`), develop tarballs from $REPRO/_toolbox/pack via `npm install --legacy-peer-deps`, `npx vite build`, then `PORT=47033 SENTRY_TUNNEL=... bun .output/server/index.mjs`. One build serves every run; behavior is switched by env (`SENTRY_LIFECYCLE`, `PROBE_ROUTEFIX`, `PROBE_DIAG`).

ROOT CAUSE. `packages/nitro/src/runtime/hooks/captureTracingEvents.ts:getParameterizedRoute()` reads `event.context.matchedRoute.route` and explicitly returns undefined for the catch-all `'/**'`. SolidStart 2 mounts its whole router as one nitro catch-all, so every page route and every `src/routes/api/**` route arrives with `matchedRoute.route === '/**'`. My diagnostic subscription on `tracing:h3.request:start` (bun, r1-bun-static-baseline.log):
  [PROBE h3.request:start] {"type":"route","url":"/users/456","matchedRoute":{"route":"/**"},"params":{"_":"users/456"},...}
  [PROBE h3.request:start] {"type":"route","url":"/api/users/789","matchedRoute":{"route":"/**"},"params":{"_":"api/users/789"},...}
  [PROBE h3.request:start] {"type":"route","url":"/nitro/users/7","matchedRoute":{"route":"/nitro/users/:id"},"params":{"id":"7"},...}

PROOF THE MECHANISM WORKS ON BUN. I added a nitro-native route `server/routes/nitro/users/[id].ts`. Same bun process, same run:
  {"type":"transaction","name":"GET /users/456","op":"http.server","source":"url",...}
  {"type":"transaction","name":"GET /api/users/789","op":"http.server","source":"url",...}
  {"type":"transaction","name":"GET /nitro/users/:id","op":"http.server","source":"route",...}
Under `traceLifecycle: 'stream'` (r3) the same split shows in the segment span:
  {"name":"GET","is_segment":true,"origin":"auto.http.nitro.srvx","source":"url"}          <- /users/456
  {"name":"GET","is_segment":true,"origin":"auto.http.nitro.srvx","source":"url"}          <- /api/users/789
  {"name":"GET /nitro/users/:id","is_segment":true,"origin":"auto.http.nitro.srvx","source":"route","http_route":"/nitro/users/:id"}
So `setHttpServerSpanRouteAttribute`, the h3 channel and the srvx segment rename all work correctly under bun. Only SolidStart's own routes are invisible to them.

NODE PARITY (r5, same build, `node .output/server/index.mjs`): `{"type":"transaction","name":"GET /users/456","source":"url"}` and `{"type":"transaction","name":"GET /api/users/789","source":"url"}` — byte-identical naming to bun, which matches the repo's own e2e assertion `transactionEvent?.transaction === 'GET /users/6'` (dev-packages/e2e-tests/test-applications/solidstart-2/tests/performance.server.test.ts:6).

WHAT DID NOT REFUTE IT: the other trace lifecycle (stream is strictly worse — the segment collapses to `GET`, `source: "url"`), a different init placement (the nitro plugin is the only shape SolidStart 2 supports; there is no `--import` preload in this build), and the bundler wiring (`sentrySolidStart()` has no route-naming knob; `@sentry/solidstart` does not re-export `setHttpServerSpanRouteAttribute`, only `getActiveSpan`/`getRootSpan`/`updateSpanName`).

WHAT DOES REFUTE IT, in app code only (see workaround): renaming the root span from inside the SolidStart request gives correct parameterized names on bun, in both lifecycles, and identically on node.
  bun/static  (r2): {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route",...}
                    {"type":"transaction","name":"GET /api/users/:id","op":"http.server","source":"route",...}
  bun/stream  (r4): {"name":"GET /users/:id","is_segment":true,"origin":"auto.http.nitro.srvx","source":"route","http_route":"/users/:id"}
                    {"name":"GET /api/users/:id","is_segment":true,"origin":"auto.http.nitro.srvx","source":"route","http_route":"/api/users/:id"}
  node/static (r6): {"type":"transaction","name":"GET /users/:id","source":"route"} / {"name":"GET /api/users/:id","source":"route"}
Residual after the workaround: the child h3/middleware spans keep the raw URL (`middleware GET /users/456`, `http.server GET /users/456`) in both lifecycles; only the segment/transaction name is fixed.

Rerun: `cd app && npm install --legacy-peer-deps && npx vite build`, then `PORT=<p> SENTRY_TUNNEL=http://127.0.0.1:<sink>/ SENTRY_LIFECYCLE=static|stream [PROBE_ROUTEFIX=1] [PROBE_DIAG=1] bun .output/server/index.mjs`; sink is `PORT=<sink> node ../sink.mjs` (extended to keep span `source`, `http.route`, trace ids). Probe files: app/server/plugins/sentry.ts (init + PROBE_DIAG channel dump), app/server/routes/nitro/users/[id].ts (nitro-native control route), app/src/setServerRouteName.ts, app/src/app.tsx, app/src/routes/api/users/[id].ts. Logs r1..r6 in the task dir. app/node_modules removed after the run; app/solidstart-2/ is an accidental nested copy of the reference e2e app (I cannot rm it) and is not part of the build.

## Workaround

Rename the root span from inside the SolidStart request. Works on bun and node, in both trace lifecycles, no SDK change.

src/setServerRouteName.ts:
  import * as Sentry from '@sentry/solidstart';
  export function setServerRouteName(method: string, route: string): void {
    const activeSpan = Sentry.getActiveSpan();
    const rootSpan = activeSpan && Sentry.getRootSpan(activeSpan);
    if (!rootSpan) return;
    rootSpan.setAttribute('http.route', route);
    rootSpan.updateName(`${method} ${route}`);
    rootSpan.setAttribute('sentry.segment.name.source', 'route');
  }

Page routes, once in src/app.tsx inside the Router root (runs during SSR, inside the request's async context):
  function ServerRouteName() {
    if (isServer) {
      const pattern = useCurrentMatches().at(-1)?.route.pattern;      // '/users/:id'
      const method = getRequestEvent()?.request.method ?? 'GET';
      if (pattern) setServerRouteName(method, pattern);
    }
    return null;
  }
  // <SentryRouter root={props => (<MetaProvider><ServerRouteName />...)}>
(`useCurrentMatches` from '@solidjs/router', `getRequestEvent`/`isServer` from 'solid-js/web'.)

API routes (`src/routes/api/**`) are not rendered by the router, so each handler calls it itself:
  export function GET(event) { setServerRouteName('GET', '/api/users/:id'); ... }

Alternative with no app code: move the endpoint to a nitro-native route under `server/routes/` (with `nitro({ serverDir: './server' })`); those get `GET /nitro/users/:id`, `source: "route"` automatically on bun. Not an option for SolidStart pages.

## Docs impact

On SolidStart 2, server transactions are named after the request URL (`GET /users/456`, `source: "url"`), not the route pattern, because SolidStart mounts its router as a single Nitro catch-all (`/**`) and the SDK only parameterizes real Nitro routes; this is the same on Bun and on Node, and under the default `traceLifecycle: 'stream'` the server span name degrades further to just the method (`GET`), so if you need grouped route names, rename the root span yourself from the Router root for pages (`useCurrentMatches().at(-1)?.route.pattern`) and from each `src/routes/api/**` handler, using `getRootSpan(getActiveSpan()).updateName('GET /users/:id')` plus `http.route` and `sentry.segment.name.source: 'route'`.
