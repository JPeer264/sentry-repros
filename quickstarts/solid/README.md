# QS-solid, the Solid getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/solid`
pulls `@sentry/browser`, `@sentry/core` and `@sentry/conventions@^0.20.0`, declares the peer
`solid-js: ^1.8.4` and the optional peers `@solidjs/router: >=0.13.4 <2.0.0-0` and
`@tanstack/solid-router: ^1.132.27`. Its `exports` map serves `.`, `./solidrouter` and
`./tanstackrouter` (types at the package root: `solidrouter.d.ts`, `tanstackrouter.d.ts`).

Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `esbuild` 0.25.9 with `esbuild-plugin-solid` 0.6.0
(`babel-preset-solid` 1.9.15), `solid-js` 1.9.15 and `@solidjs/router` 1.0.0 (the registry's
`latest` tag) from the registry, node v26.5.0, macOS 15.7.7 (Darwin 24.6.0). All envelopes go to a
local sink on `localhost:4723` via the `tunnel` option; nothing leaves the machine.

No Vite: `build.mjs` bundles `src/<variant>/index.jsx` with esbuild and `esbuild-plugin-solid`,
which runs `babel-preset-solid` on `.jsx` the way `vite-plugin-solid` does. `MODE=development` adds
the `development` export condition, which is what a Vite dev server resolves with: `solid-js` then
comes from `dist/dev.js`, where the `DEV` export the guide's `if (!DEV)` reads is truthy. A
production build resolves `dist/solid.js`, where `DEV` is `undefined`.

## What it reproduces

A new user following `docs/platforms/javascript/guides/solid/index.mdx` end to end, then the
feature pages under `guides/solid/features/`. There is no `config.yml` in `guides/solid/`; the
page's frontmatter carries `sdk: sentry.javascript.solid` and `categories: [javascript, browser]`
(index.mdx:3-7).

Where each rendered include really comes from (`javascript.solid.mdx`, else `javascript.mdx`, else
`_default.mdx`):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:16) | `platform-includes/getting-started-prerequisites/javascript.solid.mdx:1-7` ("Solid version `1.8.4`+") |
| `<Include name="quick-start-features-expandable" />` (index.mdx:60) | `includes/quick-start-features-expandable.mdx:20-27`, the section listing `javascript.solid`: issues, tracing, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-capture-errors" />` (index.mdx:147) | `platform-includes/getting-started-capture-errors/javascript.solid.mdx:1-15` |
| `<PlatformContent includePath="getting-started-sourcemaps-short-version" />` (index.mdx:155) | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx:1-19` (wizard only, not run) |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:159) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22`, snippet at 14-17 |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:163) | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` (not run) |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:182) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="logs/javascript-quick-start-verify-logs-splitlayout" />` (index.mdx:239) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:1-28`, snippet at 12-24 |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:247) | `includes/quick-start-locate-data-expandable.mdx:20-27` |

The guide's own snippets that were copied verbatim: install (index.mdx:31), `index.jsx`
(index.mdx:73-133, all four product options, so `solidRouterBrowserTracingIntegration()` from
`@sentry/solid/solidrouter`, `replayIntegration()`, `feedbackIntegration({ colorScheme: "system" })`
inside `if (!DEV) { Sentry.init(...) }`), the capture-errors include (:1-15 as
`src/base/SomeComponent.jsx`), tunneling (tunneling include :14-17), the Issues verify button
(index.mdx:187-196), the Tracing verify button (index.mdx:216-229) and the logs lines (logs include
:12-24). The source-map wizard and the `dataCollection` snippet were not run.

Feature pages: `features/solid-router.mdx:20-45` as `src/router/index.jsx` (the page's
`<Route path="/" component={App} /> ...` placeholder becomes a home route and a parameterized
`/router/users/:id` route; the sink serves `router.html` for `/router/*`), `features/error-boundary.mdx:11`
renders the same capture-errors include (`src/error-boundary/`), `features/tanstack-router.mdx:20-44`
as `src/tanstack-router/index.jsx` (build probe only, see "Not run"). `features/index.mdx` is a beta
alert (:6-13) plus `<PageGrid />`.

`src/base/app.jsx` hosts the guide's verify buttons: `#btn-throw` (index.mdx:187-196), `#btn-span`
(index.mdx:216-229), `#btn-log` (logs include :12-24), `#btn-boundary` (arms a child that throws
during render inside the include's `SentryErrorBoundary`) and `#btn-fetch`, a probe that fetches
`/recorder?from=relative` and `<origin>/recorder?from=absolute` so the sink can record whether
`sentry-trace` / `baggage` reached it under the guide's `tracePropagationTargets: ["localhost", ...]`.
The run ends with `window.__qsSentinel('sentinel')`, `captureMessage` plus a `sentinel-span`, and
polls the sink for both; the router variants first wait until `Sentry.getActiveSpan()` is empty, so
the idle pageload and navigation segments have ended before the sentinel is started. Nothing
sleeps, and `drive.mjs` gives up at a 60 s deadline.

## Install

```bash
cd $REPRO/quickstarts/solid
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
              # and repeats them in `overrides`
```

`added 75 packages, and audited 76 packages in 14s`, no peer complaints; npm's allow-scripts
warning about `esbuild@0.25.9`'s postinstall is harmless (esbuild runs from its platform package).
Installed tree (`node_modules/@sentry`): `browser browser-utils conventions core feedback replay
replay-canvas solid`; all SDK packages `10.67.0` with `resolved: file:../../_toolbox/pack-develop-03aaf424/...`
in `package-lock.json`, plus `@sentry/conventions@0.20.0` from the registry. `solid-js`,
`@solidjs/router`, `esbuild`, `esbuild-plugin-solid` (with `@babel/core`, `babel-preset-solid`) and
`playwright-core` come from the registry. `tar tzf sentry-solid-10.67.0.tgz` lists 29 `package/build/`
entries (cjs, esm, types).

Every export the docs snippets use exists: `init` and `withSentryErrorBoundary` in
`node_modules/@sentry/solid/build/types/index.d.ts` (via `./sdk` and `./errorboundary`),
`replayIntegration`, `feedbackIntegration`, `startSpan`, `logger` via `export * from '@sentry/browser'`,
`solidRouterBrowserTracingIntegration` and `withSentryRouterRouting` in `solidrouter.d.ts`,
`tanstackRouterBrowserTracingIntegration` in `tanstackrouter.d.ts`. **None is missing and nothing in
the package's `.d.ts` files is marked `@deprecated`.** `build/esm/solidrouter.js` imports
`useBeforeLeave`, `useLocation` and `useCurrentMatches` from `@solidjs/router`, all of which
`@solidjs/router@1.0.0` exports.

## Run

```bash
cd $REPRO/quickstarts/solid
./run.sh base                        # index.mdx index.jsx (all options) + capture-errors include + verify snippets
MODE=development ./run.sh base       # the same with the `development` condition (vite dev), results-base-dev.json
./run.sh router                      # solid-router.mdx:20-45, withSentryRouterRouting(Router), /router and /router/users/:id
./run.sh router-unwrapped            # the guide's index.jsx around a plain <Router>, same routes
./run.sh error-boundary              # error-boundary.mdx:11 -> capture-errors include, plus render/handler/async throw probes
```

Each run builds `dist/<variant>.js` (and `dist/<variant>.build.json` with the esbuild warnings),
starts the sink and static server on `localhost:4723`, drives one headless Chrome through the
buttons or links, triggers the sentinel and polls `/__items` for it, waits for the pageload segment
span, runs the variant-specific steps, and writes `results-<variant>.json` (`meta` from
`Sentry.getClient()`, `build`, `steps`, `summary`, `console`, `pageErrors`, the compact sink items,
the recorder headers and the raw envelope payloads). The browser console is also in
`app-<variant>.log`, the sink's 404s in `sink-<variant>.log`.

Two build-only probes: `RESULT_NAME=results-base-no-router node build.mjs base` with
`node_modules/@solidjs` moved aside (`results-base-no-router.json`) and `node build.mjs tanstack-router`
(`results-tanstack-router.json`).

## Expected

**Install and configure**

- index.mdx:31, `npm install @sentry/solid --save`; prerequisites include :7, "Solid version `1.8.4`+".
- index.mdx:73-133, `index.jsx`: `if (!DEV) { Sentry.init({ dsn, integrations: [solidRouterBrowserTracingIntegration(),
  replayIntegration(), feedbackIntegration({ colorScheme: "system" })], tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/], replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0 }) }` before `render(() => <App />, app)`. No `release`, no `enableLogs`.
- index.mdx:79, "this will only initialize your Sentry client in production builds."
- index.mdx:97-98, "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing."
- index.mdx:140-141 and capture-errors include :5-6, wrapping Solid's `ErrorBoundary` with
  `Sentry.withSentryErrorBoundary` reports exceptions from inside a component tree.
- tunneling include :14-17, `tunnel: "/tunnel"`.

**Verify**

- index.mdx:173-179 and 187-196: a button whose `onClick` throws `Error("Sentry Test Error")`
  creates an issue; "open the page in a browser and click the button to trigger a frontend error".
- index.mdx:207-210 and 216-229: the button updated to `Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, ...)`
  "start[s] a trace to measure the time it takes for the execution of your code" and triggers
  "a frontend error and trace" when clicked.
- logs include :6, `Sentry.logger.info/warn/error` lines are caught as logs.
- index.mdx:245, data shows up in the project (here: the sink).

**Solid Router (`features/solid-router.mdx`)**

- :7, Solid Router 0.13.4 and up is supported.
- :10-17, `solidRouterBrowserTracingIntegration` replaces `browserTracingIntegration`, and
  `withSentryRouterRouting(Router)` "enable[s] Sentry to reach your router context" to "create
  navigation spans".

**Error boundary (`features/error-boundary.mdx`)**

- :6-9, the wrapper "automatically capture[s] exceptions from inside a component tree and render[s] a
  fallback component".

## Observed

**base** (`results-base.json`, production build): `Sentry.getClient()` is up, SDK
`sentry.javascript.solid` 10.67.0 (`packages: [npm:@sentry/solid 10.67.0]`), integrations
`EventFilters, FunctionToString, ConversationId, BrowserApiErrors, Breadcrumbs, GlobalHandlers,
LinkedErrors, Dedupe, HttpContext, CultureContext, BrowserSession, BrowserTracing, Replay, Feedback,
SpanStreaming, WebVitals`, `traceLifecycle: "stream"`, the feedback widget `#sentry-feedback` is in
the DOM. Ten sink items, all through `/tunnel`:

- `event` x5: `Error: Sentry Test Error` from `#btn-throw`, mechanism
  `auto.browser.global_handlers.onerror`, `handled: false`, top frame `App._el$3.$$click` (Solid's
  delegated click handler); `Error: Sentry Test Error` from `#btn-span`'s timer, mechanism
  `auto.browser.browserapierrors.setTimeout`, `handled: false`; `Error: Boundary Test Error` from the
  armed child, mechanism `auto.function.solid.error_boundary`, `handled: true`, top frame `boom`, and
  the fallback `Error: Boundary Test Error` rendered in place of the child; the sentinel message; the
  replay-buffer error. Every event carries `transaction: "/base.html"`.
- `span` x2 envelopes (no `transaction` item anywhere): the pageload segment is named `Pageload`,
  `sentry.segment.name.source: url`, `url.path: /base.html`, status `error` ("Global error occurred"
  after the first click), ~330 ms, with its children `test Example Frontend Span` (`is_segment: false`,
  parent = the pageload, so the verify snippet's span is a child of the pageload trace, not a trace
  of its own), `test sentinel-span`, two `http.client GET localhost` spans for the fetch probe, and
  the `browser.*` / `resource.*` / `browser.paint` metrics spans.
- `log` x1 with `info: User example action completed`, `warn: Slow operation detected`,
  `error: Validation failed`: logs arrive without `enableLogs` in the init (`enableLogs` reads as unset).
- `replay_event` + `replay_recording` x1 after the extra error and `minReplayDuration`.
- No `session` item: the console shows `Discarded session because of missing or non-string release`
  on every event (the guide's init has no `release`).
- The recorder saw `sentry-trace` and `baggage` (with `sentry-replay_id`) on both the relative and
  the absolute same-origin fetch.
- Console: the debug lines above, one `404` for `/favicon.ico`; page errors: the two uncaught
  `Sentry Test Error`s. No Solid warnings.

**base-dev** (`results-base-dev.json`, `MODE=development`): the bundle resolves `solid-js/dist/dev.js`
(`DEV` truthy), the guide's `if (!DEV)` skips `Sentry.init`: `getClient()` is `undefined`, no
feedback widget, zero sink items after the whole run. Clicking `#btn-throw` is an uncaught page
error and nothing is sent; the boundary fallback renders `Error: Boundary Test Error` but nothing is
captured. This is what a user sees on `vite dev` after following the guide's verify step.

**router** (`results-router.json`, `@solidjs/router` 1.0.0): pageload segment `/router`
(`source: route`, `url.template: /router`, origin `auto.pageload.browser`), navigation
`/router/users/:id` (`source: route`, origin `auto.navigation.solid.solidrouter`,
`url.path: /router/users/42`, `params.id: "42"`, `url.path.parameter.id: "42"`), navigation `/router`
back, then a fresh page load at `/router/users/7` gives a pageload segment `/router/users/:id` with
`params.id: "7"`. Each navigation links to the previous trace (`previous_trace` in the console),
a `ui.interaction.click` child hangs off the navigation, `ui.webvital.lcp` / `cls` spans arrive under
the first pageload. Events carry `transaction: "/router"` and `"/router/users/7"`. No page errors,
no SDK warnings besides the release one.

**router-unwrapped** (`results-router-unwrapped.json`): the guide's `index.jsx` around a plain
`<Router>`: the two route changes render and change `location.pathname`, but the sink gets zero
`navigation` spans, and both pageloads (`/router-unwrapped`, `/router-unwrapped/users/7`) are named
`Pageload` with `source: url` and no `url.template` / `params.*`. `solidRouterBrowserTracingIntegration`
builds `browserTracingIntegration({ instrumentNavigation: false })` and starts navigation spans only
from the `useBeforeLeave` hook that `withSentryRouterRouting` installs.

**error-boundary** (`results-error-boundary.json`, init with error monitoring only, no tracing):
a child throwing during render is caught, the fallback renders `Error: Boundary Render Error`, the
event has mechanism `auto.function.solid.error_boundary`, `handled: true`; `reset()` from the
fallback re-renders the child. An `onClick` that throws inside the boundary subtree is not caught by
the boundary (Solid's `ErrorBoundary` only catches errors from computations and rendering): it is an
uncaught page error captured via `auto.browser.global_handlers.onerror`, `handled: false`, no
fallback; a `setTimeout` throw inside the subtree likewise arrives via
`auto.browser.browserapierrors.setTimeout`. Four events, no spans.

## Not run

- **tanstack-router** (`features/tanstack-router.mdx:20-44`): `@tanstack/solid-router` is not
  installed and the page shows no route tree. Build probe only: saved verbatim as
  `src/tanstack-router/index.jsx` (the fence is labelled `javascript`), `node build.mjs tanstack-router`
  fails in Babel with `Missing semicolon. (12:7)` at `declare module '@tanstack/solid-router' {`
  (`results-tanstack-router.json`); the snippet only parses as TypeScript.
- **base without Solid Router** (`results-base-no-router.json`): with `node_modules/@solidjs` moved
  aside, the guide's `index.jsx` does not build: `Could not resolve "@solidjs/router"` from
  `node_modules/@sentry/solid/build/esm/solidrouter.js:5`. The guide's install step installs
  `@sentry/solid` only and the peer is optional, yet the performance snippet imports
  `@sentry/solid/solidrouter` unconditionally.
- The source-map wizard (index.mdx:155) and the `dataCollection` snippet (index.mdx:163) need a
  Sentry org or are configuration only.
- Node-only variants (commonjs, esm, esm-without-import, late-initialization, lightweight) were
  covered by the browser run.

## Findings

1. **P0, docs wrong**, index.mdx:76 and 89 with index.mdx:31 and prerequisites include :7. With the
   performance option the guide imports `@sentry/solid/solidrouter`, whose build imports
   `@solidjs/router`, but the install step installs only `@sentry/solid` and the prerequisites list
   only Solid. Without Solid Router the app does not build (`Could not resolve "@solidjs/router"`,
   `results-base-no-router.json`). Fix: say the performance snippet needs `@solidjs/router`
   installed, and show `Sentry.browserTracingIntegration()` for apps without Solid Router.
2. **P1, docs wrong**, index.mdx:79-80 vs 173-179 and 207-210. The init is guarded by `if (!DEV)`,
   so on a dev server (the `development` export condition) `Sentry.init` never runs: `getClient()` is
   undefined and the verify clicks send nothing (`results-base-dev.json`). The verify text says
   "open the page in a browser and click the button" without saying it must be a production build.
   Fix: tell the reader in Verify to run a production build (`vite build` + `vite preview`) or to
   drop the `DEV` guard while verifying.
3. **P1, docs wrong**, index.mdx:76 and 89. The guide puts `solidRouterBrowserTracingIntegration()`
   in `integrations` but never mentions `withSentryRouterRouting`; the integration forces
   `instrumentNavigation: false`, so with a plain `<Router>` no navigation span is ever created and
   pageloads stay `Pageload` / `source: url` (`results-router-unwrapped.json`), while the wrapped
   Router yields `/router/users/:id` with `params.id` (`results-router.json`). Fix: add the
   `withSentryRouterRouting(Router)` line (or a link to the Solid Router feature page) next to the
   integration in the init snippet.
4. **P2, docs wrong**, features/tanstack-router.mdx:20 and 29-33. A `javascript` fence carries a
   TypeScript `declare module` block; saved as `.jsx` it fails to parse (`results-tanstack-router.json`).
   :14 also still says the integration creates "`pageload` and `navigation` transactions". Fix: label
   the fence `typescript` (or move the `declare module` into a TS-only note) and say "spans".
5. **P2, docs wrong (stale)**, index.mdx:97-98 and 207-210. "capture 100% of transactions" and
   "start a trace": under the default v11 lifecycle nothing arrives as a `transaction` item; the
   pageload is a `span` segment named `Pageload`, and the verify snippet's `Example Frontend Span` is
   a child span of that segment (`results-base.json`). Fix: say the button adds a span to the current
   pageload trace and that spans (not transactions) show up in Sentry.
6. **P2, SDK limit**, index.mdx:73-133. The init has no `release`, so the SDK logs `Discarded session
   because of missing or non-string release` on every event and sends no `session` items
   (`results-base.json`); release health stays empty and the docs do not mention it. Fix: note that
   sessions need `release` (or a bundler plugin that injects it).
