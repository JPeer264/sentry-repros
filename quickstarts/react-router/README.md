# QS-react-router, the React Router (framework mode) manual-setup path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/` (`@sentry/react-router`
plus its twelve `@sentry/*` dependencies, all repeated in `overrides`). `@sentry/conventions@0.20.0` is the
only `@sentry/*` package from the registry (`package-lock.json` has no other registry-resolved `@sentry/*`).
Node `v26.5.0`, macOS 15 (Darwin 24.6.0), Google Chrome via `playwright-core` 1.55.0
(`chromium.launch({ channel: 'chrome', headless: true })`, no browser download). From the registry:
`react-router`, `@react-router/{node,serve,dev}` 7.18.3 (`^7`, no 8.x hoist happened), `react`/`react-dom`
19.2.8, `vite` 7.3.6, `isbot` 5 (added by `react-router reveal`). Nothing leaves the machine: the client uses
`tunnel` to the local sink, the server a `dsn` that points at the sink.

## What it reproduces

A new user following `docs/platforms/javascript/guides/react-router/manual-setup.mdx` end to end with the page's
default onboarding options (error monitoring, tracing, session replay, user feedback; profiling off). The
`create-react-router` basic template's `root.tsx` (Layout, App, ErrorBoundary) stands in for the user's app; the
page shows no root.tsx snippet.

| Reference in the page | Renders from |
| --- | --- |
| `manual-setup.mdx:14` `sentry-init/manual-setup-callout` | `platform-includes/sentry-init/manual-setup-callout/javascript.react-router.mdx:1-6` (wizard callout) |
| `manual-setup.mdx:16` `getting-started-prerequisites` | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` |
| `manual-setup.mdx:37` `quick-start-features-expandable` | `includes/quick-start-features-expandable.mdx` |
| `manual-setup.mdx:409` `node-options-windows` | `platform-includes/node-options-windows/javascript.react-router.mdx:1-15` |
| `manual-setup.mdx:496` `vite-loadenv-hint-splitlayout.mdx` | `includes/vite-loadenv-hint-splitlayout.mdx:1-35` (its snippet uses `sentryVitePlugin`, not `sentryReactRouter`) |
| `manual-setup.mdx:527` `getting-started-tunneling` | `platform-includes/getting-started-tunneling/javascript.mdx:1-22` (`tunnel: "/tunnel"`) |
| `manual-setup.mdx:531` `getting-started-data-collection` | `platform-includes/getting-started-data-collection/javascript.mdx` (not run) |
| `manual-setup.mdx:549` `getting-started-browser-sandbox-warning` | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `manual-setup.mdx:613` logs verify | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx`, only under a `logs` option the page's `OnboardingOptionButtons` (24-35) does not offer |
| `manual-setup.mdx:621` | `includes/quick-start-locate-data-expandable.mdx` |

Snippets copied verbatim: install (`:68`), `npx react-router reveal` (`:99`), `entry.client.tsx` (`:119-178`,
`app/entry.client.tsx`), `instrument.server.mjs` (`:208-237`, minus profiling), `entry.server.tsx` (`:252-276`,
`app/entry.server.docs.tsx`), the `package.json` scripts (`:398-403`), the top-of-file import variant (`:422-428`,
`app/entry.server.top-import-verbatim.tsx`), `vite.config.ts` (`:453-473`, `vite.config.docs-verbatim.ts`),
`react-router.config.ts` (`:507-519`, `react-router.config.docs-verbatim.ts`, including the `+(await ...)` line as
printed), the verify loader (`:554-563`, `app/routes/error.tsx`) and the tracing verify loader (`:584-603`,
`app/routes/error-tracing.tsx`). Repro-only routes: `/users/:id` (loader with a server-side `fetch` to the sink's
recorder), `/action-error` (an action that throws, submitted through `<Form>`), `/api/recorder` (echoes the
`sentry-trace`/`baggage` the server received and fetches the sink recorder) and `/api/sentinel`. The source maps
section was read only (no auth token is ever set; the plugin warns and skips the upload).

## Install and run

```bash
cd $REPRO/quickstarts/react-router
npm install                      # 13 develop tarballs + React Router 7 from the registry
./run.sh import-flag             # manual-setup.mdx:401 start script as printed        -> results-import-flag.json (500s, see F3)
./run.sh import-flag-prod        # the same with NODE_ENV=production in the environment -> results-import-flag-prod.json (the working run)
./run.sh top-import-verbatim     # manual-setup.mdx:423 `import './instrument.server'`  -> build-top-import-verbatim.log (build fails, F2)
./run.sh top-import              # same with the path corrected to ../instrument.server -> results-top-import.json (500s without NODE_ENV, F3)
```

Each run copies the variant's entry file to `app/entry.server.tsx`, runs `react-router build` (`build-<variant>.log`),
starts the sink on `localhost:4760` and `react-router-serve` on `localhost:4761` (readiness is a TCP connect, so no
span is created by the probe), drives one headless Chrome (`drive.mjs`): `GET /` document request, `#btn-throw`,
`#btn-span`, `#btn-fetch` (relative fetch to `/api/recorder`), `#nav-user` (client-side navigation to `/users/7`),
`#nav-error` (client-side navigation to the verify loader), `GET /error-tracing` (document request), `/action-error`
+ `#btn-action`, `#btn-render-error`; then fires the sentinels (`captureMessage` + span on the client,
`/api/sentinel` on the server) and polls the sink for all four (hard deadline 60 s, arrived in 1.6 s), then waits
for the pageload span and the replay envelope. Results: `results-<variant>.json` (`meta`, `steps`, `sentinel`,
`summary`, browser `console`, `pageErrors`, `serverConsole`, compact `items`, recorder `headers`, `raw` envelopes).
`build/` holds the last build made (the control run below); `./run.sh import-flag-prod` rebuilds it.

## Observed on 2026-09-09

### Install, reveal, exports

`npm install` succeeded (218 packages). `npx react-router reveal` (`:99`) failed first with the docs-verbatim
`vite.config.ts` (`reveal-docs-verbatim.log`, F1) and, on its next run, installed `isbot@5` itself and pruned the
devDependencies (`removed 46 packages`, so `@react-router/dev` vanished until a second `npm install`); it then wrote
`app/entry.client.tsx` and `app/entry.server.tsx`.

Exports the snippets use, checked in `node_modules/@sentry/react-router/build/types/`:

| Export | Status on develop |
| --- | --- |
| `init`, `reactRouterTracingIntegration`, `replayIntegration`, `feedbackIntegration`, `sentryOnError`, `startSpan`, `captureMessage`, `captureException` | exist (`client/index.d.ts`) |
| `createSentryHandleRequest`, `createSentryHandleError`, `createSentryServerInstrumentation`, `wrapSentryHandleRequest`, `getMetaTagTransformer` | exist (`server/index.d.ts`) |
| `sentryReactRouter`, `sentryOnBuildEnd`, `SentryReactRouterBuildOptions` from `@sentry/react-router` (`:455`, `:509`) | **do not exist** on the root export; they live in `@sentry/react-router/vite` (`vite/index.d.ts:1-3`; `package.json` `exports` has `.`, `./cloudflare`, `./vite`) |
| `ErrorBoundary`, `withErrorBoundary` | exist, `@deprecated` ("use React Router's error boundary instead", `client/index.d.ts:6,11`), not used by the page |
| `reactRouterTracingIntegration({ useInstrumentationAPI })`, `.clientInstrumentation` | `@deprecated` (`client/tracingIntegration.d.ts:12,22`), not used by the page |
| `createSentryClientInstrumentation` (for `HydratedRouter`'s `instrumentations` prop) | exists, the page never mentions it |

`engines` of the tarball: `>=20.19.0 <22.0.0 || >=22.12.0 <23.0.0 || >=23.2.0`.

### Findings

**F1 (P0, docs wrong) `manual-setup.mdx:455` and `:509`.** `import { sentryReactRouter, type SentryReactRouterBuildOptions }
from '@sentry/react-router'` makes every React Router command fail while loading `vite.config.ts`:
`SyntaxError: The requested module '.../@sentry/react-router/build/esm/index.server.js' does not provide an export
named 'sentryReactRouter'` (`reveal-docs-verbatim.log`). With the vite config fixed, `react-router.config.ts` as
printed (`:509`, `sentryOnBuildEnd` from `@sentry/react-router`) builds the client and server and then dies in
`buildEnd`: `TypeError: (0 , __vite_ssr_import_0__.sentryOnBuildEnd) is not a function`
(`build-docs-verbatim-rr-config.log:66`). Both work from `@sentry/react-router/vite` (`vite.config.ts`,
`react-router.config.ts`, `build-import-flag.log`: the plugin prints "No auth token provided. Will not create
release" and the build passes).

**F2 (P0, docs wrong) `manual-setup.mdx:423`.** `import './instrument.server';` at the top of `app/entry.server.tsx`
cannot resolve, because `:203` told the user to create `instrument.server.mjs` in the project root:
`Could not resolve "./instrument.server" from "app/entry.server.tsx"` (`build-top-import-verbatim.log:62`).
`import '../instrument.server';` builds (`build-top-import.log`) and bundles the init into `build/server/index.js`.

**F3 (P1, SDK limit, not Sentry-specific) `manual-setup.mdx:401`.** The start script as printed,
`NODE_OPTIONS='--import ./instrument.server.mjs' react-router-serve ./build/server/index.js`, answers every request
with HTTP 500 on React 19.2.8 + `@react-router/serve` 7.18.3 when `NODE_ENV` is not set in the environment:
`TypeError: dispatcher.getOwner is not a function` in `react-dom-server.node.production.js renderWithHooks` calling
into `react.development.js` (`results-import-flag.json`, `results-top-import.json`). `@react-router/serve/dist/cli.js:41`
requires `@react-router/express` (and through it `react`) before `:48` sets `process.env.NODE_ENV ??= "production"`,
so `react` is the development build and `react-dom/server` the production build. A control with the default
`entry.server.tsx`, no `--import` and no Sentry init also returned 500 (`server-control-no-sentry-entry.log`), so the
SDK is not the cause; the page's script is just the first place a user meets it. With `NODE_ENV=production` set
(`import-flag-prod`) everything below works. Sentry did capture the failure on the server each time (mechanism
`react-router`, from `handleError`).

**F4 (P1, docs wrong) `manual-setup.mdx:186-197`.** "Sentry's OpenTelemetry-based auto-instrumentation ... is
currently only supported on Node 20 <20.19 / Node 22 <22.12". On Node 26.5.0 the `--import` run installed 48 server
integrations and produced Express spans (`middleware compression/expressInit/query/serveStatic/logger`,
`handler *`, origin `auto.http.express`) and outgoing `http.client GET localhost` spans (`auto.http.node_fetch`)
with `sentry-trace`/`baggage` on the request the sink recorded. The server log says "Registered diagnostics-channel
injection via Module.registerHooks()". The tarball's `engines` field requires the opposite range (`>=20.19.0`,
`>=22.12.0`).

**F5 (P2, docs wrong) `manual-setup.mdx:149-150`, `:223-224`.** "capture 100% of transactions": under the v11 default
(`SpanStreaming` installed on both sides) nothing arrives as a `transaction` item; every span, including the segments
(`http.server GET /users/:id`, `pageload /`, `navigation /users/:id`), arrives as `span` envelope items.

**F6 (P2, SDK limit).** `createSentryHandleError` captures React Router's 404 `ErrorResponse`s as issues: every
document request for an unknown URL produced an unhandled event `Error: No route matches URL "/favicon.ico"`
(mechanism `react-router`, transaction `GET /favicon.ico`). The page (`:245`, `:267-269`) does not say that.

**F7 (P2, SDK limit).** A server loader or action error reached the client as a second, sanitized event: server
`Error: My first Sentry error!` (mechanism `react_router.loader`, transaction `GET /error`, request `/error.data`) plus
client `Error: Unexpected Server Error` (mechanism `auto.function.react_router.on_error`, transaction `/error`); same
for the action (`react_router.action` + `on_error`). Two issues per verify error; the page (`:114`) describes
`sentryOnError` as reporting "client-side errors" only.

**F8 (P2, SDK limit).** A document request for a route without a loader or action is named `GET` (source `url`,
`http.route *`): the `GET /` boot request and the root request of `#btn-render-error`. Routes with a loader or action
are parameterized (`GET /users/:id`, `GET /api/recorder`, `POST /action-error`, source `route`).

**F9 (P2, docs wrong) `manual-setup.mdx:516`.** The diff marker sits after the indentation, so the rendered line is
`+(await sentryOnBuildEnd(...));`, which a copy makes valid but meaningless JavaScript (unary plus on the awaited
value); it built fine.

### What the working run (`import-flag-prod`) sent

Both sides identify as `sentry.javascript.react-router` `10.67.0` (client packages `npm:@sentry/react-router`,
`npm:@sentry/browser`). Client integrations (16): `EventFilters FunctionToString ConversationId BrowserApiErrors
Breadcrumbs GlobalHandlers LinkedErrors Dedupe HttpContext CultureContext BrowserSession ReactRouterTracingIntegration
Replay Feedback SpanStreaming WebVitals`. Server integrations (48): the Node default set plus `Express ... Firebase
LowQualityTransactionsFilter ReactRouterServer SpanStreaming`. 34 sink items: 11 `event`, 7 `session`,
14 `span` batches, 1 `replay_event` + 1 `replay_recording`; no `transaction`, `log` or `client_report`.

- `GET /` document request: 200, `<meta name="sentry-trace">` and `<meta name="baggage">` injected by
  `createSentryHandleRequest`; the client `pageload /` span (source `route`) continued that trace (parent id equals the
  server span id). Feedback widget rendered.
- `#btn-throw`: `Error: Sentry Test Error`, mechanism `auto.browser.global_handlers.onerror`, session `unhandled`;
  `#btn-span`: `test My First Test Transaction` span under the pageload plus `auto.browser.browserapierrors.setTimeout`.
- `#btn-fetch`: the server received `sentry-trace` and `baggage` from the browser (`tracePropagationTargets: [/^\//]`
  matched the relative URL); its own fetch to the sink carried the same trace id.
- `#nav-user`: client `navigation /users/:id` (source `route`, origin `auto.navigation.react_router`), server
  `http.server GET /users/:id` segment with `function /users/:id` (origin `auto.function.react_router.instrumentation_api`)
  and `http.client GET localhost` children.
- `/error` (client-side) and `/error-tracing` (document request, 500): server events with mechanism
  `react_router.loader`, segments `GET /error` and `GET /error-tracing` with status `error`; the `test My First Test
  Transaction` span (status `error`) sits under `GET /error-tracing`; the root `ErrorBoundary` rendered both times.
- `/action-error`: `POST /action-error` segment, `function /action-error` span, event mechanism `react_router.action`.
- `#btn-render-error`: `React ErrorBoundary Error: Render error from the home route` captured through `sentryOnError`
  (`captureReactException`, mechanism `auto.function.react_router.on_error`).
- Replay: buffer mode, converted to session on the first error, one `replay_event` after `minReplayDuration`.
- Browser console: only the SDK debug lines and the `favicon.ico` 404. Server console: the debug lines, no React
  Router warnings, no plugin warnings apart from the missing auth token at build time.
