# verify4-M-solidstart-deno-routenames

## What it re-tests

Independent re-test of the capability **route names (SolidStart 2 + Nitro 3 server transactions on Deno, `@sentry/solidstart` develop / 10.67.0)** of cell `M-solidstart-deno` (see `$REPRO/cells/M-solidstart-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-direct.pid`, `app-node.pid`, `app-static-ctrl.pid`, `app-static.pid`, `app-stream-ctrl.pid`, `app-stream-fix.pid`, `build-v1.log`, `build-v2.log`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `deno-static-mwoff.log`, `deno-static-mwon.log`, `deno-static-page.log`, `deno-static.log`, `deno-static2.log`, `deno-stream-off.log`, `deno.pid`, `deno2.pid`, `deno3.pid`, `deno4.pid`, `deno5.pid`, `deno6.pid`, `npm-install.log`, `raw-stream-ctrl.json`, `raw-stream-fix.json`, `raw-stream-fix2.json`, `run-node-ctrl.log`, `run-static-ctrl.log`, `run-static-direct.log`, `run-static.log`, `run-stream-ctrl.log`, `run-stream-fix.log`, `server/`, `sink-v1.log`, `sink.log`, `sink.pid`, `sinkv1.pid`, `src/`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

CONFIRMED, and I found the exact mechanism plus a working user-land fix (see workaround). Also one correction to the original report.

ROOT CAUSE (read off the build output, not inferred): SolidStart 2 registers exactly ONE Nitro/h3 route and does all of its own routing inside it. In `.output/server/index.mjs` the whole app is:
  var findRoute = (() => { const data = { route: "/**", handler: wrapHandlerWithTracing(_lazy_j3rF0K) }; ... })();
(the only other entries are `/_build/assets/**` and any real `server/` routes). h3 therefore sets `event.context.matchedRoute = { route: "/**" }`, and `@sentry/nitro`'s `getParameterizedRoute()` (packages/nitro/src/runtime/hooks/captureTracingEvents.ts:81) explicitly drops `'/**'` as a useless catch-all -> no route, so the srvx segment keeps the raw-URL name.
Proved at runtime from inside a SolidStart API route (`src/routes/api/w4/[id].ts` dumps the h3 event):
  {"id":"42","w":4,"nativeKeys":["app","req","url","context"],"ctxKeys":["nitro","params","matchedRoute","routeRules","_sentryServerTimingSet","solidFetchEvent"],"matchedRoute":{"route":"/**","keys":["route","handler"]}}
SolidStart's own matcher (`matchAPIRoute` in the ssr bundle) knows `"path": "/api/users/:id"` but returns only `{handler, params, isPage}` and writes just `event.params` — it never surfaces the pattern to h3, and `@sentry/solidstart` has no instrumentation of SolidStart's router.

CONTROL RUN (documented wiring, no workarounds; deno 2.9.0, traceLifecycle 'static'), sink verbatim:
  {"name":"GET /api/users/42","source":"url"}
  {"name":"GET /users/7","source":"url"}
  {"name":"GET /api/sentinel","source":"url"}
  {"name":"GET /api/nusers/:id","source":"route"}      <- real Nitro route, see below
Same run on node 26.5.0, identical:
  {"name":"GET /api/users/42","source":"url"}
  {"name":"GET /users/7","source":"url"}
Both page routes (`src/routes/users/[id].tsx`) and API routes (`src/routes/api/users/[id].ts`) are affected, so this is a SolidStart+Nitro SDK gap, not a Deno one — confirmed.

STREAM LIFECYCLE control (segment spans only shown, key `sentry.segment.name.source`):
  {"name":"GET","op":"http.server","src":"url","seg":true}          <- /api/users/42
  {"name":"GET","op":"http.server","src":"url","seg":true}          <- /users/7
CORRECTION to the report: the streamed segment span DOES carry a source attribute, `sentry.segment.name.source: "url"`. The "no source attribute at all" reading is an artifact of the shared sink, which maps `attributes['sentry.source']` (an old key) rather than `sentry.segment.name.source`. The method-only name "GET" is by design (`HTTP_SPAN_NAME_FALLBACK` / low-cardinality rule) once the route is unknown, so the streaming case is the same single defect, not a second, worse one.

THE NITRO LAYER ITSELF IS FINE. I added a real Nitro server route `app/server/api/nusers/[id].ts` (picked up by `nitro({ serverDir: './server' })`, registered as `route: "/api/nusers/:id"`). It is named correctly on both runtimes and both lifecycles, with no user code:
  static: {"name":"GET /api/nusers/:id","source":"route"}
  stream: {"name":"GET /api/nusers/:id","op":"http.server","src":"route","route":"/api/nusers/:id","seg":true}
So `@sentry/nitro`'s h3 hook works; only routes owned by SolidStart's file router are unnamed.

WHAT I TRIED AND REJECTED: no init placement, entry shape, lifecycle, or build flag changes this — the route pattern never reaches h3, so nothing the SDK subscribes to can see it. There is no SDK option to supply it.

REPO E2E REFERENCE: the SDK's own app agrees with the broken behavior — `dev-packages/e2e-tests/test-applications/solidstart-2/tests/performance.server.test.ts:6` asserts `transactionEvent?.transaction === 'GET /users/6'`, i.e. the raw URL for the `src/routes/users/[id].tsx` route. The shipped e2e suite encodes the URL naming as expected, so this will not be caught by CI.

PROBE FILES (rerunnable; `app/.output/` is kept and self-contained, `node_modules` removed):
  $SCRATCH/deep/verify4-M-solidstart-deno-routenames/app/{vite.config.ts,package.json}
  .../app/src/middleware.ts, .../app/src/app.tsx, .../app/src/routes/api/{users,w1,w2,w3,w4}/[id].ts, .../app/src/routes/users/[id].tsx, .../app/server/{plugins/sentry.ts,api/nusers/[id].ts}
  logs: .../run-static.log, run-static-ctrl.log, run-stream-ctrl.log, run-stream-fix.log, run-static-direct.log, run-node-ctrl.log, raw-stream-ctrl.json, raw-stream-fix2.json, build-v1.log, build-v2.log
COMMANDS:
  npm install --legacy-peer-deps <deps + $REPRO/_toolbox/pack/sentry-*.tgz>   (as in the original report)
  cd app && NODE_ENV=production npx vite build
  PORT=41599 node $REPRO/_toolbox/sink.mjs &
  PORT=41611 HOST=127.0.0.1 SENTRY_TUNNEL=http://127.0.0.1:41599/ SENTRY_LIFECYCLE=static [SENTRY_MW_ROUTE=off SENTRY_PAGE_ROUTE=off|direct] deno run -A .output/server/index.mjs
  curl the endpoints, then curl -s 'http://127.0.0.1:41599/__items?raw=1'

## Workaround

Two small pieces of user code restore parameterized names on both runtimes and BOTH lifecycles. Verified end to end.

1) API routes — one global SolidStart middleware. `event.params` is populated by SolidStart before `onBeforeResponse`, so the pattern can be rebuilt from it:

// src/middleware.ts  (register with solidStart({ middleware: './src/middleware.ts' }))
import { setHttpServerSpanRouteAttribute } from '@sentry/server-utils';
import { createMiddleware } from '@solidjs/start/middleware';
export default createMiddleware({
  onBeforeResponse: [(event) => {
    const params = event.params;
    if (!params || !Object.keys(params).length) return;
    const byValue = new Map(Object.entries(params).map(([k, v]) => [String(v), k]));
    const pattern = new URL(event.request.url).pathname.split('/')
      .map(s => (byValue.has(s) ? `:${byValue.get(s)}` : s)).join('/');
    setHttpServerSpanRouteAttribute(pattern);
  }],
});

2) SSR page routes — call the same helper from the Router root during SSR, where `useCurrentMatches()` knows the pattern:

// src/app.tsx
import { setHttpServerSpanRouteAttribute } from '@sentry/server-utils';
import { Router, useCurrentMatches } from '@solidjs/router';
import { isServer } from 'solid-js/web';
function Root(props) {
  const matches = useCurrentMatches();
  if (isServer) {
    const last = matches()[matches().length - 1];
    const pattern = last?.route?.pattern || last?.route?.originalPath;
    if (pattern) setHttpServerSpanRouteAttribute(pattern);
  }
  return <Suspense>{props.children}</Suspense>;
}

Results with both in place — static lifecycle:
  {"name":"GET /api/users/:id","op":"http.server","source":"route","spans":["http.server GET /api/users/42","middleware GET /api/users/42","http.server GET /api/users/42"]}
  {"name":"GET /users/:id","source":"route"}
stream lifecycle (segment spans):
  {"name":"GET /api/users/:id","op":"http.server","src":"route","route":"/api/users/:id","seg":true}
  {"name":"GET /users/:id","op":"http.server","src":"route","route":"/users/:id","seg":true}

Notes and cheaper variants:
- `setHttpServerSpanRouteAttribute` is exported from `@sentry/server-utils` (a transitive dep of `@sentry/solidstart`); it is NOT re-exported from `@sentry/solidstart`, so the app has to depend on `@sentry/server-utils` directly. Making `@sentry/solidstart` re-export it would be a one-line SDK improvement.
- Per-route variant, no middleware: call `setHttpServerSpanRouteAttribute('/api/users/:id')` at the top of the handler -> `{"name":"GET /api/w1/:id","source":"route"}` (route `w1` in the probe).
- Without `@sentry/server-utils`, `getRootSpan(getActiveSpan())` + `updateSpanName(root, 'GET /api/x/:id')` + `root.setAttribute('http.route', ...)` also renames, but leaves `source: "custom"` rather than `"route"` (route `w2`: `{"name":"GET /api/w2/:id","source":"custom"}`), because it does not set `sentry.segment.name.source`.
- Mutating `getRequestEvent().nativeEvent.context.matchedRoute = { route: '/api/x/:id' }` works too (route `w3`, `source: "route"`), since `@sentry/nitro`'s `beforeSpanEnd` re-reads it — but it pokes an h3 internal, so prefer the helper.
- Only the segment span is renamed; the two inner non-segment `http.server` spans stay `"GET"` under stream lifecycle. That is cosmetic and does not affect transaction grouping.
- Moving an endpoint out of `src/routes/` into a real Nitro route under `server/` (with `nitro({ serverDir: './server' })`) gets parameterized names with zero Sentry code, if that fits the app.

The real fix belongs in the SDK: `@sentry/solidstart` should hook SolidStart's own matcher (it already computes `"path": "/api/users/:id"` in `matchAPIRoute`, and page matches are available via the router) and call `setHttpServerSpanRouteAttribute`, the same way `@sentry/nitro` does for h3 routes.

## Docs impact

On SolidStart 2 (Nitro 3) the SDK cannot parameterize server transaction names on its own: SolidStart mounts a single `/**` catch-all in Nitro and routes internally, so both API routes and SSR page routes are reported with the raw path (`GET /api/users/42`, `transaction_info.source: "url"`; under span streaming the segment span is named `GET` with `sentry.segment.name.source: "url"`). To get `GET /api/users/:id`, call `setHttpServerSpanRouteAttribute(pattern)` from `@sentry/server-utils` — for API routes from a global `createMiddleware({ onBeforeResponse })` that rebuilds the pattern from `event.params`, and for page routes from your Router root component during SSR using `useCurrentMatches()`. Routes defined as real Nitro server routes (under `server/` with `nitro({ serverDir })`) are parameterized automatically and need none of this.
