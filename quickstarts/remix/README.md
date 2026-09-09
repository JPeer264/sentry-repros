# QS-remix, the Remix manual-setup path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`), installed
from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/remix` pulls `@sentry/node`,
`@sentry/react`, `@sentry/core`, `@sentry/server-utils`, `@sentry/server-runtime-injection` and
`@sentry/conventions@^0.20.0`, and declares peers `@remix-run/node: 2.x`, `@remix-run/react: 2.x`,
`@remix-run/server-runtime: 2.x`, `react: 18.x`. Package exports: `.`, `./cloudflare`, `./vite`, `./import`.

Remix `2.17.5` (`@remix-run/{node,react,dev,serve,express}`), `react`/`react-dom` `18.3.1`, `vite` `6.4.3`,
`express` `4.21.2` from the registry. Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0
(`chromium.launch({ channel: 'chrome', headless: true })`, no browser download), node v26.5.0, macOS (Darwin
24.6.0). The browser SDK posts to a local sink through `tunnel`, the server SDK through a DSN that points at the
sink; nothing leaves the machine. The wizard is out of scope.

## What it reproduces

A new user following `docs/platforms/javascript/guides/remix/manual-setup.mdx` (1-83) end to end. The page body
is two includes; where each rendered step really comes from (`javascript.remix.mdx`, else `javascript.mdx`,
else `_default.mdx`):

| Reference in the page | Renders from |
| --- | --- |
| `manual-setup.mdx:12-15` `getting-started-prerequisites` (platform `javascript.remix`) | `platform-includes/getting-started-prerequisites/javascript.remix.mdx:1-7` ("Remix version `2.0.0`+") |
| `manual-setup.mdx:33` `<Include name="quick-start-features-expandable" />` | `includes/quick-start-features-expandable.mdx` |
| `manual-setup.mdx:48-58` install | inline: `npm install @sentry/remix --save` |
| `manual-setup.mdx:81` `getting-started-complete` | `platform-includes/getting-started-complete/javascript.remix.mdx:1-551`, everything below |
| `javascript.remix.mdx:14-63` | `entry.client.tsx` snippet (`browserTracingIntegration({ useEffect, useLocation, useMatches })`, `replayIntegration()`, `feedbackIntegration`, `tracesSampleRate`, `tracePropagationTargets: ["localhost", ...]`, replay rates) |
| `javascript.remix.mdx:82-92` | `root.tsx` `ErrorBoundary` with `captureRemixErrorBoundaryError` |
| `javascript.remix.mdx:109-139` | `root.tsx` `withSentry(App)` |
| `javascript.remix.mdx:158-196` | `instrument.server.mjs` (`tracesSampleRate`, `captureActionFormDataKeys: { key_x, key_y }`) |
| `javascript.remix.mdx:209-213` | `NODE_OPTIONS='--import=./instrument.server.mjs' remix-serve build` |
| `javascript.remix.mdx:230-240` | Express expandable: `import "./instrument.server.mjs";` first |
| `javascript.remix.mdx:313-324` | `entry.server.tsx`: `wrapHandleErrorWithSentry(...)` and `sentryHandleError` |
| `javascript.remix.mdx:359-384` | `vite.config.ts` with `sentryVitePlugin` from `@sentry/vite-plugin`, `build.sourcemap: "hidden"` (read only, no upload) |
| `javascript.remix.mdx:407` | `includes/vite-loadenv-hint-splitlayout.mdx:1-35` (read only) |
| `javascript.remix.mdx:412` `getting-started-tunneling` | `platform-includes/getting-started-tunneling/javascript.mdx:1-22` (`tunnel: "/tunnel"`) |
| `javascript.remix.mdx:418` `getting-started-data-collection` | `platform-includes/getting-started-data-collection/javascript.mdx` (not run) |
| `javascript.remix.mdx:430` `getting-started-browser-sandbox-warning` | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx` |
| `javascript.remix.mdx:443-452`, `:473-493` | the verify button, and its "Tracing" version with `Sentry.startSpan` + `fetch("/api/sentry-example-api")` |

The page never prints `sentryRemixVitePlugin`. Only the migration page mentions it
(`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:1287-1297`: "moved to the `@sentry/remix/vite`
subpath ... applies the build-time instrumentation transform now"). The page prints `sentryVitePlugin` from
`@sentry/vite-plugin` (`javascript.remix.mdx:362`).

Every export the snippets use exists in `node_modules/@sentry/remix/build/types/`: `init`,
`browserTracingIntegration` (`client/browserTracingIntegration.d.ts`), `replayIntegration` and
`feedbackIntegration` (via `export * from '@sentry/react'`), `captureRemixErrorBoundaryError`
(`client/errors.d.ts`), `withSentry` (`client/performance.d.ts`), `wrapHandleErrorWithSentry` and
`sentryHandleError` (`server/instrumentServer.d.ts`), `startSpan`, and the `captureActionFormDataKeys` option
(`utils/remixOptions.d.ts`). **None is missing and none is marked `@deprecated`.** `sentryRemixVitePlugin` exists
at `build/types/vite/index.d.ts` (subpath `@sentry/remix/vite`, options `appDirPath`, `buildTimeInstrumentation`).
`@sentry/vite-plugin` is not part of the install (`ls node_modules/@sentry/vite-plugin`: no such directory).

## The app

`app/entry.client.tsx` (docs 14-63 with the performance and session-replay options, plus `tunnel`, `debug: true`
and the `window.__qsSentinel` / `window.__qsMeta` hooks), `app/root.tsx` (docs 109-139 and 82-92; the docs
boundary calls `useRouteError()` without importing it, the import is added and the `...` placeholder renders a
document; a repro-only root `loader` returns `{ ok: true }`), `app/entry.server.tsx` (docs 316-320,
`wrapHandleErrorWithSentry` with a custom handler that logs `[handleError] <error> for <method> <url>`),
`app/variants/entry.server.direct.tsx` (docs 323, `sentryHandleError`), `app/variants/entry.server.verbatim.tsx`
(docs 313-324 pasted as printed), `instrument.server.mjs` (docs 158-196 with the performance option and
`debug: true`), `vite.config.ts` (docs 359-384 shape; `QS_VITE_PLUGIN=none|remix|docs` selects no plugin,
`sentryRemixVitePlugin` from `@sentry/remix/vite`, or the page's `@sentry/vite-plugin` import), `server.mjs`
(docs 230-240, an Express server from the Remix template).

Routes: `/` (verify page: `#btn-throw` docs 443-452, `#btn-span` docs 473-493, `#btn-fetch` to the sink's
recorder, links), `/users/$id` (loader does a server-side `fetch` to the recorder), `/loader-throws` (loader
throws), `/action-throws` (two forms posting `key_x`, `key_y`, `password`, `unlisted`; one action returns, one
throws), `/sentinel` (resource route: `captureMessage` + `startSpan`, returns SDK name, version and integrations).

## Install

```bash
cd $REPRO/quickstarts/remix
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball and repeats them in `overrides`
```

`added 631 packages in 34s`, no peer complaints, no `--legacy-peer-deps`. `node_modules/@sentry` holds
`browser browser-utils bundler-plugins core feedback node opentelemetry react remix replay replay-canvas
server-runtime-injection server-utils`, all `10.67.0` from the tarballs, plus `@sentry/conventions@0.20.0` from the
registry (the only registry-resolved `@sentry/*` entry in `package-lock.json`).

## Run

```bash
cd $REPRO/quickstarts/remix
./run.sh remix-serve            # build + NODE_OPTIONS='--import=./instrument.server.mjs' remix-serve ./build/server/index.js
./run.sh remix-serve-direct     # same, handleError = Sentry.sentryHandleError
./run.sh express                # node server.mjs (import "./instrument.server.mjs" first)
./run.sh vite-plugin            # build with sentryRemixVitePlugin from @sentry/remix/vite, remix-serve
./run.sh vite-plugin-docs       # build only, vite.config.ts importing @sentry/vite-plugin as printed
./run.sh handle-error-verbatim  # build only, entry.server.tsx with both handleError exports as printed
./run.sh docs-start-command     # start only, remix-serve build (the command as printed)
```

`BUILD_ONLY=1` stops after `remix vite:build`, `SKIP_BUILD=1` reuses `build/`. Sink on `localhost:4758`, app on
`localhost:4759`, both checked free first. The driver clicks the verify buttons, navigates client-side to
`/users/7`, home, `/loader-throws`, submits the ok and the throwing action, requests `/loader-throws` as a document,
then fires the sentinel on both sides (`window.__qsSentinel('sentinel')`, `GET /sentinel`) and polls the sink for
the two messages and two spans (deadline 60 s, arrived in ~0.5 s every time), then waits for the pageload
segment. `results-<variant>.json` holds `meta`, `serverSentinel`, `steps`, `summary` (events, segments, spans,
headers), the browser console and the server log, `pageErrors`, the compact sink items and the raw envelopes.

## Expected (what the page claims)

- `manual-setup.mdx:48-58`: `npm install @sentry/remix --save` is the whole install.
- `javascript.remix.mdx:104`: "Wrap your Remix root component with `withSentry` to capture performance data".
- `javascript.remix.mdx:75-77`: in the `ErrorBoundary`, `captureRemixErrorBoundaryError(error)` sends the error.
- `javascript.remix.mdx:153, 204-213`: `instrument.server.mjs`, run with `NODE_OPTIONS='--import=./instrument.server.mjs' remix-serve build` "to make sure the Sentry module loads before any other application code runs".
- `javascript.remix.mdx:189-194`: "Optionally capture action formData attributes with errors. This requires `sendDefaultPii` set to true as well." (`captureActionFormDataKeys: { key_x: true, key_y: true }`).
- `javascript.remix.mdx:302`: `handleError` in `entry.server.tsx` captures server-side errors automatically, with `wrapHandleErrorWithSentry` or `sentryHandleError`.
- `javascript.remix.mdx:306`: "Sentry's Remix SDK automatically records your `action` and `loader` transactions".
- `javascript.remix.mdx:347-384`: source maps via `sentryVitePlugin` from `@sentry/vite-plugin` and `build.sourcemap: "hidden"`.
- `javascript.remix.mdx:466-493`: the tracing button starts a trace and calls a non-existing route, "click the button to trigger the frontend error and a trace".

## Observed on 2026-09-09

### Install and exports

Holds (above). The page's `vite.config.ts` needs `@sentry/vite-plugin`, which nothing installs (finding 2).

### Build (`remix vite:build`)

`✓ 409 modules transformed`, client in ~0.9 s, SSR in 16 ms. Console: the five Remix future-flag warnings
(`v3_fetcherPersist`, `v3_lazyRouteDiscovery`, `v3_relativeSplatPath`, `v3_singleFetch`,
`v3_throwAbortReason`) and, because of the page's `sourcemap: "hidden"`, Remix's "Source maps are enabled in
production. This makes your server code publicly visible in the browser. This is highly discouraged!". The
build leaves 11 `.map` files in `build/client/assets/` (no `sourceMappingURL` comment in the bundles), a folder
`remix-serve` serves as static files (`build-remix-serve.log`).

- `handle-error-verbatim`: `[vite:esbuild] Transform failed with 2 errors: ERROR: Multiple exports with the same name "handleError"`, `The symbol "handleError" has already been declared`; exit 1 (`results-handle-error-verbatim.json`).
- `vite-plugin-docs`: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@sentry/vite-plugin'`; exit 1 (`results-vite-plugin-docs.json`).
- `vite-plugin`: `[Sentry Remix] Found 4 static and 1 dynamic routes` (three times), exit 0. The SSR bundle now inlines `@remix-run/server-runtime`/`@remix-run/node` with 10 `diagnostics_channel` injection sites (`build-vite-plugin.log`).

### Start

- `docs-start-command` (`remix-serve build` as printed, with a Vite build present): `Error: Directory import '$REPRO/quickstarts/remix/build' is not supported resolving ES modules imported from node_modules/@remix-run/serve/dist/cli.js`, the process dies; with no `build/` at all it is `ENOENT ... stat '.../build'`. The Sentry SDK captured both as unhandled rejections (`results-docs-start-command.json`). `remix-serve ./build/server/index.js` (the Remix Vite template's start script) works.
- `--import`: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing Sentry`, `SDK initialized from CommonJS` (the package's `node` export condition has no `import` entry, so the `.mjs` file loads the CJS build), `[Sentry] Runtime hook registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, `[instrumentation:express, router] "express" injected at runtime` (remix-serve is Express), then `[remix-serve] http://localhost:4759`. With `NODE_OPTIONS` set in the environment of `npx remix-serve`, the SDK also initializes inside the npm process (two `Initializing Sentry` lines, pids differ); `npm start` with the variable inside the script string does not do that.
- Server identity (from `/sentinel` and the events): `sentry.javascript.remix` `10.67.0`, packages `npm:@sentry/remix`, `npm:@sentry/node`, node v26.5.0, **47 integrations**: the 45 of the Node run (see `../koa/README.md`) plus `Http` and `Remix`, with `SpanStreaming`.
- Client identity: `sentry.javascript.remix` `10.67.0`, packages `npm:@sentry/remix`, `npm:@sentry/react`; `getOptions().integrations`: `EventFilters FunctionToString ConversationId BrowserApiErrors Breadcrumbs GlobalHandlers LinkedErrors Dedupe HttpContext CultureContext BrowserSession BrowserTracing Replay`, plus `SpanStreaming` and `WebVitals` installed by the SDK (15 on the events).

### Runtime, identical in `remix-serve`, `remix-serve-direct` and `express` (29 sink items each)

- Document request `GET /`: server segment `http.server` named **`GET`** (source `url`, no path) with a child `function` span `LOADER root`; the response's root loader data carries `sentryTrace` and `sentryBaggage` added by the SDK, no `<meta name="sentry-trace">` exists, and the client `pageload` span (`routes/_index`, source `route`, origin `auto.pageload.remix`) has the **same trace id** as the server segment: the pageload continues the server trace with the page's snippets alone.
- `#btn-throw`: client event `Error: Sentry Example Frontend Error`, mechanism `auto.browser.browserapierrors.addEventListener`, handled `false`, `transaction: routes/_index`; a page error too (React 18 rethrows).
- `#btn-span`: client segment `Example Frontend Span` (op `test`, status `error`) with a child `http.client GET localhost` (404); the server answers `/api/sentry-example-api` with a segment named `GET` (status `error`, 404, no event since it is an `ErrorResponse`); the throw arrives as a second `Sentry Example Frontend Error` via `auto.browser.global_handlers.onunhandledrejection`. Two error events total, as the page promises.
- `#btn-fetch`: the cross-origin `fetch("http://localhost:4758/recorder")` reached the recorder with `sentry-trace` and `baggage` (`sentry-replay_id` included), `tracePropagationTargets: ["localhost", ...]` matched.
- `/users/7` by `<Link>`: client `navigation` span `routes/users.$id` (source `route`, origin `auto.navigation.remix`) in its own trace with 1 span; the data request `GET /users/7?_data=routes%2Fusers.%24id` and the server segment `GET users/:id` (source `route`, `http.route: users/:id`) with `LOADER routes/users.$id` and the loader's outgoing `http.client GET localhost` (`sentry-trace` reached the recorder) all carry the **pageload's** trace id: the data request goes out before the `useEffect`-driven navigation span starts, so every server trace of a client-side navigation belongs to the previous route's trace (also seen for `/loader-throws`, which joined the trace of the `navigation routes/_index` span before it).
- `/loader-throws` by `<Link>`: `handleError` ran (`[handleError] Error: Sentry Example Loader Error for GET .../loader-throws?_data=routes%2Floader-throws`), server event `Error: Sentry Example Loader Error`, mechanism `auto.function.remix.server` (`data.function: remix.server.handleError`), handled `false`, `transaction: GET /loader-throws`, request URL with `?_data=`; server segment `GET loader-throws` status `error`, 500, child `LOADER routes/loader-throws` status `error`. The root `ErrorBoundary` rendered "Unexpected Server Error" (Remix sanitizes server errors in production) and `captureRemixErrorBoundaryError` sent a **second event**, `Error: Unexpected Server Error`, mechanism `instrument`, handled `false`, `transaction: routes/_index` (the previous route). The wrapped custom handler also receives the 404 `ErrorResponse`s (`[handleError] [object Object] for GET .../favicon.ico`, `/api/sentry-example-api`), which the SDK does not capture.
- `/action-throws`, throwing form: `[handleError] Error: Sentry Example Action Error for POST .../action-throws?_data=...`, server event `POST /action-throws`, same mechanism; segment `POST action-throws` with `ACTION routes/action-throws` (status `error`, `error.type: Error`, `match.route.id`), and the client boundary event `Unexpected Server Error` again. **No `remix.action_form_data.*` attribute anywhere** (span or event) although `captureActionFormDataKeys: { key_x: true, key_y: true }` is set and the form posted `key_x`/`key_y`: `server/integrations/tracing-channel.js:159` skips the form data when `"error" in data`. The ok form (run in `vite-plugin`, `steps[7].result.okAction`) puts `remix.action_form_data.key_x: "[Filtered]"` and `remix.action_form_data.key_y: "[Filtered]"` on the `ACTION` span; `password` and `unlisted` are absent (keys honoured), the two listed values are redacted with the snippet as printed (no `sendDefaultPii`).
- `/loader-throws` as a document request: 500, server event (`transaction: GET /loader-throws`, URL without `?_data=`), the boundary is SSR'd, and after hydration the client captures `Unexpected Server Error` once more (`transaction: /loader-throws`).
- Sessions: every client session is dropped, `Sentry Logger [warn]: Discarded session because of missing or non-string release` (the snippet sets no `release`, the Vite build injects none); the server logs `Recorded request session with status: ok` (aggregate, not flushed within the run).
- Replay: one `replay_event` + `replay_recording` after the first error (buffer mode, `replaysOnErrorSampleRate: 1.0`).
- Sentinels: client `sentinel` event + `sentinel-span` segment, server `sentinel-server` event + `sentinel-server-span` (child of `GET sentinel`), all within ~0.5 s. Envelope item types seen: `event`, `span`, `replay_event`, `replay_recording`; **no `transaction` item on either side**, loaders and actions are `function` spans inside `http.server` segments.
- `remix-serve-direct` (`sentryHandleError`): the same events and spans, no `[handleError]` lines (nothing to log). `express`: identical, the server log starts with `[express] http://localhost:4759`.

### `vite-plugin` (31 sink items)

Same events and server spans, plus: client span names become URL patterns from the injected route manifest,
`pageload /`, `navigation /users/:id`, `pageload /action-throws` (source `route`), and client events carry
`transaction: /`, `/action-throws`. The server still logs `[Sentry] Bundler plugin did not run` and
`injected libraries=[]` although the plugin instrumented the SSR bundle; server spans are unchanged (the
`Remix` integration and `instrumentServer()` cover loaders and actions without the plugin).

## Findings

1. **P0, docs wrong**, `javascript.remix.mdx:313-324`: the `entry.server.tsx` block prints two `export const handleError` lines ("Alternative: ..."); pasted as printed the build fails (`Multiple exports with the same name "handleError"`). Split it into two snippets or tabs.
2. **P0, docs wrong**, `javascript.remix.mdx:362` vs `manual-setup.mdx:48-58`: the source-maps `vite.config.ts` imports `@sentry/vite-plugin`, which the install step never adds; `remix vite:build` exits 1 with `Cannot find package '@sentry/vite-plugin'`. Add the install line to the step (or use `sentryRemixVitePlugin` from `@sentry/remix/vite`).
3. **P1, docs wrong**, `javascript.remix.mdx:210`: `remix-serve build` does not start a Remix 2 Vite build (`Directory import '.../build' is not supported`); the working command is `remix-serve ./build/server/index.js`.
4. **P1, docs wrong**, `javascript.remix.mdx:189-194`: "capture action formData attributes with errors": a throwing action gets no `remix.action_form_data.*` attribute at all, a successful one gets them on its `ACTION` span with the listed values as `[Filtered]` when the snippet is used as printed. Say where the fields land and that values stay `[Filtered]` unless `sendDefaultPii: true`.
5. **P2, docs wrong**, `javascript.remix.mdx:306`: "records your action and loader transactions": they arrive as `span` items (`function` spans `LOADER ...`/`ACTION ...` inside `http.server` segments named `GET users/:id`), no `transaction` item exists. Say "spans".
6. **P2, docs wrong**, `javascript.remix.mdx:82-92`: the `ErrorBoundary` snippet uses `useRouteError()` without importing it from `@remix-run/react`.
7. **P2, docs wrong**, `javascript.remix.mdx:379-382`: `sourcemap: "hidden"` makes Remix print its "Source maps are enabled in production ... highly discouraged" warning and leaves the `.map` files in the publicly served `build/client/assets/`; say so and point at deleting them after upload.
8. **P2, docs wrong**, `javascript.remix.mdx:359-384`: the page never mentions `sentryRemixVitePlugin` (`@sentry/remix/vite`), the build plugin the develop package ships; only the migration page does. With it, client span names are URL patterns (`/users/:id`) instead of route ids (`routes/users.$id`).
9. **P2, SDK limit**: `captureRemixErrorBoundaryError` in the root boundary captures the sanitized `Error: Unexpected Server Error` for every server-side loader/action error in production, a second issue with no information next to the server event (`client/errors.js` captures any `Error` that is not a `Response`).
10. **P2, SDK limit**: the data request of a client-side navigation carries the previous route's trace id, so the server segment of `/users/7` sits in the pageload trace while the `navigation` span has a trace of its own with one span.
11. **P2, SDK limit**: requests for the index route and unmatched URLs produce `http.server` segments named just `GET` (source `url`), with no path.
12. **P2, SDK limit**: client sessions are discarded (`missing or non-string release`); the snippets set no `release` and the Vite build injects none, so release health never starts.
13. **P2, SDK limit**: with `sentryRemixVitePlugin` in the build the runtime still logs `[Sentry] Bundler plugin did not run` and `injected libraries=[]`, so a user cannot tell whether the build-time instrumentation is active.
