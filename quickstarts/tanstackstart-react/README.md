# QS-tanstackstart-react, the TanStack Start (React) manual-setup path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`), installed
from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/tanstackstart-react` pulls
`@sentry/node`, `@sentry/react`, `@sentry/core`, `@sentry/browser-utils`, `@sentry/server-utils`,
`@sentry/server-runtime-injection`, `@sentry/bundler-plugins`, `@sentry/conventions@^0.20.0` and declares no
peer dependencies. Node `v26.5.0`, macOS (Darwin 24.6.0), Google Chrome 153.0.8010.37 driven by
`playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome', headless: true })`, no browser download).
From the registry: `@tanstack/react-start` 1.168.50, `@tanstack/react-router` 1.170.33, `react` and
`react-dom` 19.2.8, `nitro` 3.0.260903-beta, `vite` 8.2.2 (see Install for why not 7). The browser tunnels
to a local sink (`tunnel`), the server's DSN points at the same sink; nothing leaves the machine except the
build plugin's telemetry line (see below). The wizard is out of scope; Bun, Deno and Cloudflare are in the cells.

## What it reproduces

A new user following `docs/platforms/javascript/guides/tanstackstart-react/manual-setup/index.mdx` end to
end (frontmatter `sdk: sentry.javascript.tanstackstart-react`, `categories: [javascript, server, server-node,
browser]`, index.mdx:5-10). Where each rendered include really comes from
(`javascript.tanstackstart-react.mdx`, else `javascript.mdx`, else `_default.mdx`):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="sentry-init/manual-setup-callout" />` (index.mdx:13) | `platform-includes/sentry-init/manual-setup-callout/javascript.tanstackstart-react.mdx:1-5`, the `sentry init` alert |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:25) | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` |
| `<Include name="quick-start-features-expandable" />` (index.mdx:42) | `includes/quick-start-features-expandable.mdx:20-27` (`javascript.tanstackstart-react` in the browser row: issues, tracing, sessionReplay, logs, userFeedback) |
| `<Include name="vite-loadenv-hint-splitlayout.mdx" />` (index.mdx:278) | `includes/vite-loadenv-hint-splitlayout.mdx:1-35` (its snippet calls `sentryVitePlugin`, not `sentryTanstackStart`) |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:558) | `platform-includes/getting-started-data-collection/javascript.mdx` (read only) |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:577) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="logs/javascript-quick-start-verify-logs-splitlayout" />` (index.mdx:679) | only under a `logs` onboarding option that index.mdx:33-40 does not offer, so never rendered |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:687) | `includes/quick-start-locate-data-expandable.mdx` |

Snippets copied verbatim: install (index.mdx:56), `src/instrument.client.ts` (84-118, all four product
options, plus `tunnel` and `debug: true`), `src/client.tsx` (131-147, plus the repro-only `./qs-hooks`
import), the `src/router.tsx` diff (164-180; its `createRouter()` takes no arguments, a Start app needs
`createRouter({ routeTree })`, the one deviation), `instrument.server.mjs` (199-214, plus `debug: true`),
`vite.config.ts` (233-249), the build/start scripts (327-334, 351-361), `src/server.ts` for `--import`
(299-310) and without it (390-402), `src/start.ts` (428-441), the verify button (582-591), the tracing verify
route (609-630) and button (649-669). Source maps (514-518) and tunneling (520-554) were read only, no auth
token was ever provided. The error-boundary snippets (462-508) were not run.

Repro-only additions: `/users/$userId` (parameterized route, `#nav-user` navigates to `/users/7`),
`/loader-error` (a loader that throws, with an `errorComponent`), `#btn-serverfn` (a `createServerFn` handler
that throws), `/api/server-fetch` (server route that `fetch`es the sink's `/recorder` and echoes the incoming
`sentry-trace`), `/api/sentinel` (server sentinel and identity probe), `src/qs-hooks.ts` (client sentinel and
identity probe).

## Install

```bash
cd $REPRO/quickstarts/tanstackstart-react
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball and repeats them in `overrides`
```

`added 167 packages in 26s`. `node_modules/@sentry`: `browser browser-utils bundler-plugins conventions core
feedback node opentelemetry react replay replay-canvas server-runtime-injection server-utils
tanstackstart-react`, all `10.67.0` from `file:../../_toolbox/...`; `package-lock.json` has no
registry-resolved `@sentry/*` entry except `@sentry/conventions@0.20.0`.

The page names no Vite major. `vite@7.3.6` (the SDK e2e app's major) was tried first: the Nitro build then
prints `WARN vite@7.3.6 is installed ... but the vite builder requires ^8` and dies in Rollup
(`Cannot read properties of null (reading 'getVariableForExportName')`), so the runs use `vite@8.2.2`.
The verbatim `vite.config.ts` (no Nitro, no React plugin) built fine on both majors.

Exports the snippets use, checked in `node_modules/@sentry/tanstackstart-react/build/types/`
(`index.types.d.ts`, `server/index.d.ts`, `client/index.d.ts`, `vite/index.d.ts`): `init`,
`replayIntegration`, `feedbackIntegration`, `addIntegration`, `tanstackRouterBrowserTracingIntegration`,
`wrapFetchWithSentry` (server barrel only, `undefined` in the client build), `sentryGlobalRequestMiddleware`,
`sentryGlobalFunctionMiddleware`, `withErrorBoundary`, `captureException`, `startSpan`, `sentryTanstackStart`
(`./vite`). **None is missing, none is `@deprecated`** (`grep -r @deprecated build/types` is empty). Runtime
confirmation is in `clientMeta.exports` / `serverMeta.exports` of the results files.

## Run

```bash
cd $REPRO/quickstarts/tanstackstart-react
./run.sh verbatim       # index.mdx vite.config.ts as printed: build, then the page's cp and start commands
./run.sh nitro          # + nitro() in vite.config.nitro.ts, src/server.ts = --import variant, node --import ... .output/server/index.mjs
./run.sh no-import      # src/server.ts imports ../instrument.server.mjs, started with node .output/server/index.mjs
./run.sh plugin-first   # sentryTanstackStart() before tanstackStart() (not run, see below)
# BUILD_ONLY=1 ./run.sh <variant> builds only; SKIP_BUILD=1 ./run.sh <variant> reuses .output/
```

Sink on `localhost:4762` (`/tunnel` for the browser, `/api/1/envelope/` for Node, `/recorder` records
`sentry-trace`/`baggage`), the Nitro server on `localhost:4763` (`PORT=4763`). `drive.mjs` opens `/`, waits
for `Sentry.getClient()` and hydration, clicks the verify buttons, `#btn-serverfn`, `#btn-fetch`, navigates
client-side to `/users/7` and `/loader-error`, fires the sentinel on both sides (`window.__qsSentinel`,
`GET /api/sentinel`) and polls the sink for the sentinel event plus span of each side (60 s hard deadline),
waits for the pageload segment, then loads `/users/42` and `/loader-error` as fresh documents and repeats the
sentinel. Nothing sleeps. Output: `results-<variant>.json` (`clientMeta`, `serverMeta`, `steps`, `summary`,
`console.{browser,build,server}`, compact `items`, recorder `headers`, `raw` envelopes), `build-<variant>.log`,
`server-<variant>.log`, `sink-<variant>.log`.

## Expected (what the page says)

- index.mdx:17: "compatible with TanStack Start 1.0 RC and is currently in beta".
- index.mdx:79, 126: `src/instrument.client.ts`, imported first in `src/client.tsx`.
- index.mdx:103-104, 206-207: "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing".
- index.mdx:159-180: `Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router))` when `!router.isServer`.
- index.mdx:226-249: `sentryTanstackStart` in `vite.config.ts`, "By default, this plugin manages source map uploads. When tracing is enabled, it also automatically instruments middlewares for tracing"; the snippet's plugin list is `tanstackStart()` then `sentryTanstackStart(...)` with the comment "sentryTanstackStart should be last".
- index.mdx:282: "explicitly define a server entry point ... and wrap your request handler with `wrapFetchWithSentry`".
- index.mdx:322-334: "when using Nitro, copy the instrumentation file to `.output/server`", build script `vite build && cp instrument.server.mjs .output/server`.
- index.mdx:346-361: `start: node --import ./.output/server/instrument.server.mjs .output/server/index.mjs`.
- index.mdx:369-379: the no-`--import` variant only instruments "native Node.js APIs (such as `fetch` and the `http` module)", "will not capture data from database calls, queues, ORMs, third-party libraries, or other framework-specific data".
- index.mdx:416-423: the global middlewares capture "server-side errors from HTTP requests and server function calls"; "SSR rendering exceptions are not captured by the middleware".
- index.mdx:449: "Sentry automatically captures unhandled client-side errors. Errors caught by your own error boundaries aren't captured unless you report them manually".
- index.mdx:516: source maps "are automatically uploaded during production builds" if the plugin is configured.
- index.mdx:639-644: clicking the tracing button triggers "a frontend error" and "an error within the API route" and "starts a performance trace".

## Observed on 2026-09-09

### verbatim (`results-verbatim.json`)

`vite build` with index.mdx:233-249 as printed exits 0 (`build-verbatim.log`) and writes `dist/client/` and
`dist/server/server.js`; there is no `.output/`. The page's build script tail `cp instrument.server.mjs
.output/server` (index.mdx:331) fails with `cp: .output/server: No such file or directory`, and the start
command (index.mdx:358) fails with `ERR_MODULE_NOT_FOUND ... .output/server/instrument.server.mjs`. The
`.output/server/index.mjs` layout only exists with the `nitro()` Vite plugin, which the page never installs,
imports or lists; its "when using Nitro" (index.mdx:322) is the only hint. **Broken as printed.** JSX
compiled without a React Vite plugin, so that omission is harmless.

Build console: `[sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To
disable telemetry, set options.telemetry to false` (once per Vite environment, so twice here and three times
with Nitro), `Warning: No auth token provided. Will not create release` and `... Will not upload source maps`.
The `.map` files Vite reports were removed from `dist/` (0 left in `dist/client/assets`), so no maps ship and
none upload.

### nitro (`results-nitro.json`), the page's intended path

Build exits 0 (`build-nitro.log`, 3 environments: client, ssr, nitro). `.output/server/index.mjs` and the
copied `instrument.server.mjs` exist; `node --import ./.output/server/instrument.server.mjs
.output/server/index.mjs` starts on 4763. **Works.** 29 sink items, both sentinels arrived on both sides.

Identity: client `sentry.javascript.tanstackstart-react` `10.67.0` (packages `npm:@sentry/tanstackstart-react`,
`npm:@sentry/react`), server `sentry.javascript.tanstackstart-react` `10.67.0` (`npm:@sentry/node`), both
`traceLifecycle: "stream"`. Client integrations (from the error event's `sdk.integrations`): `EventFilters
FunctionToString ConversationId BrowserApiErrors Breadcrumbs GlobalHandlers LinkedErrors Dedupe HttpContext
CultureContext BrowserSession Replay Feedback BrowserTracing SpanStreaming WebVitals` (`BrowserTracing`
arrives via `addIntegration` in `router.tsx`, so it is absent from `clientMeta.integrations`, which reads
`options.integrations`). Server: the 46 integrations of the Node run (`EventFilters ... Firebase
SpanStreaming`, listed in `serverMeta.integrations`). The Feedback widget rendered (`#sentry-feedback`).

| Step | Sink |
| --- | --- |
| `#btn-throw` (index.mdx:582-591) | client `event` `Error: Sentry Test Error`, mechanism `auto.browser.global_handlers.onerror`, handled false, `transaction: "/"` |
| `#btn-span` (index.mdx:649-669 + 609-630) | server `event` `Error: Sentry Example Route Error`, mechanism `auto.middleware.tanstackstart.request`, `transaction: "GET /api/sentry-example"`; client `event` `Error: Sentry Example Frontend Error`, mechanism `auto.browser.global_handlers.onunhandledrejection`; client `span` `test Example Frontend Span` (status error) with child `http.client GET localhost` (500); server `http.server` segment (status error, 500). All share one trace id (`c66cc328...`) |
| `#btn-serverfn` | server `event` `Error: Sentry Server Function Test Error`, mechanism `auto.middleware.tanstackstart.server_function`, `transaction: "GET /_serverFn/<64-hex hash>"`; server `span` `function GET /_serverFn/throwServerError` (origin `auto.function.tanstackstart.server`) under the `http.server` segment; client `event` for the rejected promise |
| `#btn-fetch` | the browser's `sentry-trace`/`baggage` reached the server route (echoed back, same trace id); the server's `fetch` to the sink carried `sentry-trace` and `baggage` of the same trace (`headers[0]`); server `span` `http.client GET localhost` (origin `auto.http.node_fetch`) |
| `#nav-user` to `/users/7` | client `navigation` segment `/users/$userId`, source `route`, origin `auto.navigation.react.tanstack_router`, `url.path` `/users/7` |
| `#nav-loader` to `/loader-error` | the `errorComponent` rendered; **no event on either side**; client `navigation` segment `/loader-error` |
| `GET /users/42` (SSR) | server `http.server` segment named `GET`, `sentry.segment.name.source: url`, `url.path: /users/42`, **no `http.route`**; no client `pageload` for `/users/42` reached the sink (the document was left before the idle timeout) |
| `GET /loader-error` (SSR) | HTTP 500, the `errorComponent` rendered, server `http.server` segment status error, **no event on either side** |
| pageload of `/` | client `pageload` segment `/`, source `route`, origin `auto.pageload.react.tanstack_router`, with web vitals, `browser.*`, `resource.*` and `ui.interaction.click` children |

Every server `http.server` segment is named `GET` with source `url` (`sentry.segment.name: "GET"`), including
`/api/sentry-example` and `/users/42`; the parameterized `GET /users/$userId` the SDK e2e test expects
(`tests/route-parametrization.test.ts:60-61`, under `traceLifecycle: 'static'`) does not appear. The server
log has `Sentry Logger [warn]: [Tracing] Ignoring name source on a child span: this attribute is only valid on
the root span.` once per request, which is where the route name goes. The error events do carry
`GET /api/sentry-example` and `GET /_serverFn/<hash>` as `transaction`.

Other items: 5 client `session` items (init/ok/unhandled), 1 `replay_event` + `replay_recording` (buffer
mode, flushed by the error), no `log` items (no logs option on this page), no `transaction` items on either
side: every span arrived as a `span` envelope item. No server session: `Sentry Logger [warn]: Discarded
session because of missing or non-string release` (the snippets set no `release`, and the `--import`ed
instrument file is outside the bundle the plugin could inject one into).

### no-import (`results-no-import.json`)

`src/server.ts` = index.mdx:390-402, started as `node .output/server/index.mjs`. **Works**, 26 sink items,
both sentinels on both sides. `Sentry.init` runs after Nitro's `Listening on` line. The same 46 server
integrations, the same events and mechanisms, the same `http.server` / `function` / `http.client` spans and
the same `GET` segment names as the `--import` run; the request middleware event and the server function
event both arrive. One difference: the bundled instrument file got a release from the Sentry Vite plugin
(`sentry-release=8845028c...` in the outgoing baggage), so this variant does not drop server sessions for a
missing release. The page's "only native Node.js APIs" restriction (index.mdx:373-374) was not contradicted
by anything this app does (no database or ORM in it).

### plugin-first

`vite.config.plugin-first.ts` exists but was **not run** (time budget). The position claim at index.mdx:241
("sentryTanstackStart should be last") stays unverified here; the Cloudflare cell covers it.

## Findings

1. **P0, docs wrong**, index.mdx:233-249 with 327-334 and 351-361: the printed `vite.config.ts` has no
   Nitro plugin, yet the build and start scripts assume Nitro's `.output/server/index.mjs`. Verbatim, `vite
   build` writes `dist/server/server.js`, `cp instrument.server.mjs .output/server` fails, and `node --import
   ./.output/server/instrument.server.mjs .output/server/index.mjs` fails with `ERR_MODULE_NOT_FOUND`. Fix:
   add `nitro()` from `nitro/vite` (and `npm install nitro`) to the snippet, or print the `dist/server`
   commands for the plain Vite build.
2. **P2, docs wrong**, index.mdx:103-104, 206-207, 644: "capture 100% of transactions", "starts a performance
   trace". Under the default `traceLifecycle: "stream"` on both sides, no `transaction` envelope item is
   produced; every span (pageload, navigation, `http.server`, `function`, `http.client`) arrives as a `span`
   item. Fix: say "spans" / "traces".
3. **P2, SDK limit**, index.mdx:416-419 (the middlewares "capture server-side errors from HTTP requests and
   server function calls"): true for errors, but the server segment name is `GET` with source `url` for every
   request, including `/users/42` and `/api/sentry-example`; no `http.route`, and the server log warns
   `Ignoring name source on a child span` per request. Route parametrization exists on the client
   (`/users/$userId`) and on the error event's `transaction`, not on the server segment. A docs-side note
   that server spans are named by method only would set expectations.
4. **P2, SDK limit / docs silent**, index.mdx:420-423 says SSR rendering exceptions are not captured; a route
   `loader` that throws during SSR returns HTTP 500 with the `errorComponent` and produces no event on either
   side, and the same loader throwing during client navigation produces no client event either (the router
   catches it). The page's `errorComponent` snippet (493-508) is the only capture path; say that loaders are
   included.
5. **P2, docs gap**, index.mdx:164-180: the `router.tsx` diff calls `createRouter()` with no arguments;
   a Start app must pass `{ routeTree }` (from `./routeTree.gen`), otherwise the snippet is not a working file.
6. **P2, docs gap**, index.mdx:194-214: no `release` is set, so the `--import`ed server SDK logs `Discarded
   session because of missing or non-string release` and sends no server sessions; the bundled variant gets a
   release from the Vite plugin. Mention `release` (or `SENTRY_RELEASE`) for the `--import` layout.
7. **P2, docs gap**, index.mdx:226-249: the plugin prints `Sending telemetry data on issues and performance
   to Sentry` on every build environment; the page does not mention `telemetry: false`.
8. **P2, docs gap**, index.mdx:278 renders `includes/vite-loadenv-hint-splitlayout.mdx`, whose snippet calls
   `sentryVitePlugin(...)`, a name this page never imports (it uses `sentryTanstackStart`).
9. **P2, SDK limit**, the current `nitro` beta (3.0.260903-beta) requires Vite 8 while the SDK package's own
   dev/e2e pin is Vite 7 (`vite: ^6.4.3` devDependency); a fresh `npm install nitro vite` today gives Vite 8,
   on which the whole path worked. Not a docs claim, recorded for the reader.
