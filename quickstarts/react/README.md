# QS-react, the React getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/react`
pulls `@sentry/browser`, `@sentry/core` and `@sentry/conventions@^0.20.0` and declares peers
`react: 17.x || 18.x || 19.x` and `react-router: 6.x || 7.x || 8.x` (optional).

Google Chrome 152.0.7977.83 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `esbuild` 0.25.9 (`jsx: 'automatic'`, production bundles),
node v26.5.0, macOS 15.7.7 (Darwin 24.6.0). `react` and `react-dom` 19.2.8, `react-router` 7.18.3
(plus 8.3.1 under the npm alias `react-router-v8`), `redux` 5.0.1, all from the registry. All
envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

## What it reproduces

A new user following `docs/platforms/javascript/guides/react/index.mdx` end to end, then the feature
pages the guide links for setup. There is no `config.yml` in `guides/react/`; the page's frontmatter
carries `sdk: sentry.javascript.react` and `categories: [javascript, browser]` (index.mdx:4-7).

Where each rendered include really comes from (`javascript.react.mdx`, else `javascript.mdx`, else
`_default.mdx`):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="llm-rules-platform" />` (index.mdx:10) | `platform-includes/llm-rules-platform/javascript.react.mdx:1`, an `AgentSetupCallout` only |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:12) | `platform-includes/getting-started-prerequisites/_default.mdx:1-6`, no `javascript` or `javascript.react` variant exists |
| `<Include name="quick-start-features-expandable" />` (index.mdx:57) | `includes/quick-start-features-expandable.mdx:20-27`, the `javascript.react` section: issues, tracing, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:322) | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:326) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `features/redux.mdx:8` `<Include name="platforms/configuration/integrations/redux.mdx" />` | `includes/platforms/configuration/integrations/redux.mdx:1-119`, whose first line pulls `platform-includes/configuration/redux-init/javascript.mdx:1-21` |

The guide's own snippets that were copied verbatim: install (index.mdx:33), `instrument.js`
(index.mdx:73-117, all four product options), `main.jsx` for React 19 (index.mdx:156-174), the
routing step (index.mdx:242-264), the Redux step (index.mdx:283-290), tunneling (index.mdx:307-312),
the verify button (index.mdx:361-370), the tracing verify button (index.mdx:376-389), the logs lines
(index.mdx:397-401) and `debug: true` (index.mdx:414-419). The React 18 `ErrorBoundary` expandable
(index.mdx:179-198) is covered by the error-boundary page runs.

Feature pages: `features/error-boundary.mdx` (27-39, 59-69, 80-86, 92-114, 125-149, 181-204),
`features/react-router/v7.mdx` (index.mdx's routing snippet plus 57-63, 71-108, 122-160, 239-255),
`features/react-router/v8.mdx` (35-66, 222-258), `features/component-monitoring.mdx` (16-32),
`features/redux.mdx` via the guide's own Redux snippet. `features/component-names.mdx` and
`features/tanstack-router.mdx` were not run, see below. `features/react-router/v6.mdx` was not run
separately: its snippets are the v7 ones with `react-router-dom` imports and `V6` suffixes, and the
two verbatim breakages found on the v7 page exist on it at the same places (v6.mdx:94, 150
`ReactDOM.render`; v6.mdx:126/142 `wrapUseRoutes` vs `wrapUseRoutesV6`; v6.mdx:239 `as Error`).

Every variant page carries the guide's verify buttons (`src/shared/VerifyButtons.jsx`): `#btn-throw`
(index.mdx:361-370), `#btn-span` (index.mdx:376-389), `#btn-log` (index.mdx:397-401) and `#btn-fetch`,
a probe that fetches `/recorder?from=relative` and `<origin>/recorder?from=absolute` so the sink can
record whether `sentry-trace` / `baggage` reached it under the guide's
`tracePropagationTargets: [/^\//, ...]`. The run ends with `window.__qsSentinel('sentinel')`,
`captureMessage` plus a `sentinel-span`, and polls the sink for both; nothing sleeps.

## Install

```bash
cd $REPRO/quickstarts/react
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
              # and repeats them in `overrides`
```

`added 21 packages, and audited 22 packages in 3s`, no peer complaints. Installed tree
(`node_modules/@sentry`): `browser browser-utils conventions core feedback react replay
replay-canvas`; all SDK packages `10.67.0` from `file:../../_toolbox/pack-develop-03aaf424/…`, plus
`@sentry/conventions@0.20.0` from the registry. `package-lock.json` has no non-toolbox `@sentry/*`
`resolved` entry other than `conventions`. `react`, `react-dom`, `react-router` (7.18.3 and 8.3.1),
`redux`, `esbuild` and `playwright-core` come from the registry.

Every export the docs snippets use exists in `node_modules/@sentry/react/build/types/index.d.ts`:
`init`, `reactErrorHandler`, `captureReactException`, `ErrorBoundary`, `withErrorBoundary`,
`Profiler`, `withProfiler`, `useProfiler`, `createReduxEnhancer`,
`reactRouterV{3,4,5,6,7}BrowserTracingIntegration`, `withSentryRouting`,
`withSentryReactRouterV{6,7}Routing`, `wrapUseRoutesV{6,7}`, `wrapCreateBrowserRouterV{6,7}`,
`wrapCreateMemoryRouterV{6,7}`, `reactRouterBrowserTracingIntegration`, `wrapReactRouterRouting`,
`wrapCreateBrowserRouter`, `wrapCreateMemoryRouter`, `wrapUseRoutes`,
`tanstackRouterBrowserTracingIntegration`, and `browserTracingIntegration`, `replayIntegration`,
`feedbackIntegration`, `startSpan`, `captureMessage`, `captureException`, `logger` via
`export * from '@sentry/browser'`. **None is missing.** Every `*V6` and `*V7` function carries
`@deprecated Use <version-agnostic name> instead` (`reactrouterv6.d.ts:9-39`, `reactrouterv7.d.ts:9-39`).
The package also exports a `./react-router` subpath (`build/types/react-router.d.ts`) whose
`reactRouterBrowserTracingIntegration()` pulls the router hooks from `react-router` itself, so no
`useEffect`/`useLocation`/... arguments are needed; no docs page mentions it.

## Run

```bash
cd $REPRO/quickstarts/react
./run.sh base                          # index.mdx: instrument.js + React 19 main.jsx + verify buttons
./run.sh error-boundary                # error-boundary.mdx with its own React 19 main.jsx (reactErrorHandler hooks)
./run.sh error-boundary-plain          # the same App on a plain createRoot, the React 18 path / control run
./run.sh react-router-v7               # index.mdx routing step + v7.mdx data mode, react-router@7, opened at /users/42
./run.sh react-router-v7-declarative   # v7.mdx:71-108 verbatim (ReactDOM.render)
./run.sh react-router-v7-useroutes     # v7.mdx:122-160 verbatim (wrapUseRoutes vs wrapUseRoutesV7)
./run.sh react-router-v8               # v8.mdx data mode with the version-agnostic APIs, react-router@8, opened at /users/42
./run.sh profiler                      # component-monitoring.mdx withProfiler(App)
./run.sh redux                         # index.mdx Redux step, createStore(rootReducer, compose(sentryEnhancer))
```

Each run builds `dist/<variant>.js`, starts the sink and static server on `localhost:4713` (with an
SPA fallback to `public/<variant>.html` for extension-less paths), drives one headless Chrome
through the buttons, triggers the sentinel and polls `/__items` for it, waits for the pageload
segment span, runs the variant-specific steps (navigation links, boundary buttons, dispatches), and
writes `results-<variant>.json` (`meta` from `Sentry.getClient()`, `steps`, `summary`, `console`,
`pageErrors`, the compact sink items, the recorder headers and the raw envelope payloads). The
browser console is also in `app-<variant>.log`. `MODE=development ./run.sh <variant>` builds the
development bundles instead and writes `results-<variant>-dev.json` (not used for the findings below).

## Expected

**Install and configure**

- index.mdx:33, `npm install @sentry/react --save`.
- index.mdx:66-68, create `instrument.js` and import it "**before** any other imports in your
  application entry point"; index.mdx:73-117 is the `Sentry.init` with `browserTracingIntegration()`,
  `replayIntegration()`, `feedbackIntegration({ colorScheme: "system" })`, `tracesSampleRate: 1.0`,
  `tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/]`,
  `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`. No `release`.
- index.mdx:98-99, "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing."
- index.mdx:151, React 19 "error hooks that integrate directly with Sentry", snippet at 156-174 with
  `onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => { console.warn(...) })`,
  `onCaughtError: Sentry.reactErrorHandler()`, `onRecoverableError: Sentry.reactErrorHandler()`.
- index.mdx:181-194, React 18 and below: `<Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>`.
- index.mdx:242-264, routing: `Sentry.reactRouterV7BrowserTracingIntegration({ useEffect, useLocation,
  useNavigationType, createRoutesFromChildren, matchRoutes })` with imports from `"react-router"`.
- index.mdx:283-290, Redux: `const store = createStore(rootReducer, compose(sentryEnhancer))`.
- index.mdx:307-312, `tunnel: "/tunnel"`.
- `getting-started-data-collection/javascript.mdx:5-8`, "By default, the SDK sends user identity
  data ... The SDK always filters sensitive values whose keys match a built-in denylist, such as
  `auth` or `password`, and sends `[Filtered]` instead."

**Verify**

- index.mdx:328-332, "Add a test button to trigger an error ... You should see "Sentry Test Error"
  with a stack trace pointing to your source code"; snippet 361-370.
- index.mdx:336-338, "**Tracing** ... You should see page load traces and the test span"; snippet
  374-389, "To test tracing, wrap the error in a span".
- index.mdx:344-346, "**Session Replay** ... Watch a video-like recording of your session, including
  the moment the error occurred."
- index.mdx:352-354 and 395-401, logs: `Sentry.logger.info("User action", { userId: "123" })`,
  `.warn`, `.error`.
- index.mdx:412-419, `debug: true` "to see SDK activity in the console".

**Feature pages**

- error-boundary.mdx:18-25, `reactErrorHandler()` is the global safety net, `ErrorBoundary` "Reports
  errors to Sentry AND renders fallback UI"; "**In React 19+, they complement each other**"; the
  React 19 `main.jsx` at 27-39 with all three hooks, then `ErrorBoundary` per section (43-53).
- error-boundary.mdx:71-74, when a child throws "Sentry captures the error with the React component
  stack", the fallback renders, the rest keeps working; 116-119, the fallback function receives
  `error`, `componentStack`, `resetError`; 151 "Use `beforeCapture` to tag errors by section";
  173 "use `Sentry.captureReactException` to maintain the linked component stack"; 167 the
  component stack is attached "via `error.cause`" through `LinkedErrors`.
- react-router/index.mdx:16 and v7.mdx:163, v8.mdx:165, "`pageload`/`navigation` transactions with
  parameterized transaction names (for example, `/teams/:teamid/user/:userid`)".
- v7.mdx:12-16, "Starting with SDK version `10.59.0`, Sentry provides version-agnostic APIs that
  replace the v7-specific ones used on this page ... The v7-specific APIs will be removed in the
  next major version"; v7.mdx:26-64 `wrapCreateBrowserRouterV7`; 66-108 `withSentryReactRouterV7Routing`
  with `ReactDOM.render(...)`; 112-161 `wrapUseRoutesV7`; 211-257 the custom `errorElement` boundary
  with `import { useRouteError } from "react-router-dom"` and `const error = useRouteError() as Error;`
  inside a `jsx` block.
- v8.mdx:29-32 `wrapCreateBrowserRouter`; 71 `wrapReactRouterRouting`; 104 `ReactDOM.createRoot(...)`;
  117 `wrapUseRoutes`; 243-247 the boundary with `from "react-router"` and the same `as Error` cast.
- component-monitoring.mdx:6, `withProfiler` "attaches React related spans to the current active
  transaction on the scope"; 34, "three different kinds of op-codes: `ui.react.mount`,
  `ui.react.render`, and `ui.react.update`"; 62-72 the `name`, `includeRender`, `includeUpdates` options.
- redux include :6-16, pass the enhancer, do not call it; 18-27 `normalizeDepth`; 109-113
  `attachReduxState` "attaches a file `redux_state.json` with Redux state to all error events".
- component-names.mdx:38-51, component names need `@sentry/babel-plugin-component-annotate` through a
  bundler plugin; "although there is a Sentry bundler plugin for **esbuild**, React component name
  capturing is currently not supported."
- tanstack-router.mdx:18-37, `Sentry.tanstackRouterBrowserTracingIntegration(router)`.

**What v10-to-v11 changes about the above** (`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx`)

- :88, "React 16 is no longer supported. The minimum version is **17**."
- :192, "Transactions no longer exist: what used to be one transaction event is a service span with
  its child spans." Verify must produce `span` envelopes, not `transaction` envelopes.
- :350/:356, `pageload` and `navigation` names fall back to `Pageload` and `Navigation`; :344, URLs
  and route parameters leave the name.
- :454, "React, Vue, and Svelte component lifecycles: `ui.react.mount`/`render`/`update` ... →
  `ui.mount`, `ui.render`, `ui.update`".
- :840, `captureMessage()` attaches a synthetic stack trace by default.

## Observed on 2026-09-08

### Step 1, install

`npm install` of the seven develop tarballs plus React, React Router, Redux and the tooling
succeeded with no peer or version complaints. One `npm install @sentry/react` is all a reader needs.
**Holds.**

### Step 2, configure (`results-base.json`)

`instrument.js` (index.mdx:73-117) initializes without a warning. `Sentry.getClient()` reports:

```json
{"SDK_VERSION":"10.67.0",
 "sdk":{"name":"sentry.javascript.react","version":"10.67.0","packages":[{"name":"npm:@sentry/react","version":"10.67.0"}]},
 "integrations":["EventFilters","FunctionToString","ConversationId","BrowserApiErrors","Breadcrumbs",
                 "GlobalHandlers","LinkedErrors","Dedupe","HttpContext","CultureContext","BrowserSession",
                 "BrowserTracing","Replay","Feedback","SpanStreaming","WebVitals"],
 "options":{"tracesSampleRate":1,"tracePropagationTargets":["/^\\//","/^https:\\/\\/yourserver\\.io\\/api/"],
            "replaysSessionSampleRate":0.1,"replaysOnErrorSampleRate":1,"tunnel":"/tunnel",
            "traceLifecycle":"stream","attachStacktrace":true,"debug":true},
 "react":"19.2.8"}
```

16 integrations (the router variants, which have no replay or feedback in their snippet, get 14).
`traceLifecycle` resolves to `"stream"` and `attachStacktrace` to `true` without being set.
`#sentry-feedback` (the feedback widget button) is in the DOM. The envelope headers carry
`{"name":"sentry.javascript.react","version":"10.67.0"}` and every event carries
`contexts.react = {"version":"19.2.8"}`. **Holds.**

`debug: true` prints one `Integration installed: <name>` line per integration and the tracing and
replay lifecycle, but no SDK name, version or browser version, as in the browser and Node runs.

**No session envelope is ever sent, in any of the nine runs.** The guide's snippet has no `release`,
and the console shows, twice per run:

```
warning: Sentry Logger [warn]: Discarded session because of missing or non-string release
```

The item type list of the `base` run is `event event event event span log event replay_event
replay_recording`; the `BrowserSession` integration is installed but Release Health gets nothing. The
browser guide's snippet sets `release: "my-project-name@2.3.12"`; the React guide never mentions it.

### Step 3, verify (`results-base.json`)

`#btn-throw` (index.mdx:361-370), a React 19 `onClick` that throws:

```json
{"type":"event","exception":"Error: Sentry Test Error","mechanism":"auto.browser.global_handlers.onerror","handled":false,
 "sdk":"sentry.javascript.react","sdk_version":"10.67.0","transaction":"/base.html",
 "contexts":["trace","react","culture"],"tags":{"replayId":"06ddb3f7f9564c289e3e3a48e7020d37"},
 "topFrame":{"function":"onClick","filename":"http://localhost:4713/base.js","in_app":true},
 "breadcrumbs":["ui.click: body > div#app > div > div > button#btn-throw[type=\"button\"]"]}
```

React 19 re-throws event-handler errors to the window, so this arrives through `GlobalHandlers`,
unhandled, with a frame on `onClick`. **Holds.**

`#btn-span` (index.mdx:376-389), "wrap the error in a span":

```json
{"op":"test","name":"Example Frontend Span","status":"ok","duration_ms":0,"is_segment":false,"origin":"manual",
 "attributes":{"sentry.segment.name":"Pageload","sentry.segment.id":"9dc35942429fd66c"}}
{"type":"event","exception":"Error: Sentry Test Error","mechanism":"auto.browser.browserapierrors.setTimeout","handled":false,
 "topFrame":{"function":"?","filename":"http://localhost:4713/base.js","in_app":true}}
```

The span ends synchronously with a 0 ms duration and `status: ok`, 99 ms before the `setTimeout`
callback throws; the error is then captured by `BrowserApiErrors` and marks the still-open pageload
segment `status: "error"` (`[Tracing] Root span: internal_error -> Global error occurred`). Both
halves reach Sentry, but the error is not inside the span in any timing sense. **Partial.**

Spans, one `span` envelope with 16 items and no `transaction` envelope anywhere:

```json
{"type":"span","sdk":"sentry.javascript.react","sdk_version":"10.67.0",
 "items":["test Example Frontend Span","test sentinel-span","http.client GET localhost","http.client GET localhost",
          "browser.dom_content_loaded_event http://localhost:4713/base.html","browser.load_event …","browser.connect …",
          "browser.cache …","browser.dns …","browser.request …","browser.response …","resource.script localhost",
          "resource.other localhost","browser.paint first-paint","browser.paint first-contentful-paint","pageload Pageload"]}
{"op":"pageload","name":"Pageload","status":"error","is_segment":true,"segment_name":"Pageload","source":"url",
 "origin":"auto.pageload.browser","url_path":"/base.html","duration_ms":513,
 "attributes":{"sentry.idle_span_finish_reason":"idleTimeout","browser.web_vital.ttfb.value":2.8,"browser.web_vital.fcp.value":352}}
```

The guide's "page load traces and the test span" (index.mdx:338) holds in substance: the test span is
a child of a `pageload` segment span named `Pageload`. Nothing in the guide, and nothing on the
React Router pages, says that these are `span` items and not transactions, while index.mdx:99
still says "capture 100% of transactions". (`resource.other localhost` is Chrome's `/favicon.ico`
request, the one `404` in every console log.)

`#btn-fetch`, the guide's `tracePropagationTargets: [/^\//, …]` (index.mdx:105):

```json
{"url":"/recorder?from=relative","sentry-trace":"e223957fd71e42c3bf5879a61e52b972-89a612b867f560a7-1","baggage":"sentry-environment=production,sentry-public_key=…,sentry-trace_id=e223957fd71e42c3bf5879a61e52b972,sentry-org_id=0,sentry-replay_id=06ddb3f7f9564c289e3e3a48e7020d37,sentry-sampled=true,sentry-sample_rand=0.1996679093435807,sentry-sample_rate=1","traceparent":null}
{"url":"/recorder?from=absolute","sentry-trace":"e223957fd71e42c3bf5879a61e52b972-bed436654960f174-1","baggage":"…same…","traceparent":null}
```

Both the relative and the absolute same-origin URL get `sentry-trace` and `baggage`; `/^\//` is
matched against the URL as written and against the resolved one. Two `http.client GET localhost`
spans with `url.full` are created. **Holds.**

`#btn-log` (index.mdx:397-401):

```json
{"type":"log","items":["info: User action","warn: Slow response","error: Operation failed"],
 "attributes":[{"userId":"123","sentry.sdk.name":"sentry.javascript.react","sentry.sdk.version":"10.67.0","sentry.replay_id":"06ddb3f7…","sentry.trace.parent_span_id":"9dc35942429fd66c"}]}
```

**Holds.** Note that index.mdx:48-55 offers `error-monitoring`, `performance`, `session-replay` and
`user-feedback` as onboarding options, so the `<OnboardingOption optionId="logs">` blocks at
index.mdx:350-356 and 393-403 have no button that turns them on; whether they ever render was not
verified here (no docs build).

`#btn-render-error`, a component that throws during render with no `ErrorBoundary`, i.e. the
`onUncaughtError` hook of index.mdx:163-167:

```json
{"type":"event","exception":"React ErrorBoundary Error: Render error without boundary","mechanism":"chained","handled":true,
 "exceptions":[{"type":"React ErrorBoundary Error","value":"Render error without boundary","mechanism":"chained","handled":true,"parent_id":0,"frames":3},
               {"type":"Error","value":"Render error without boundary","mechanism":"auto.function.react.error_handler","handled":true,"frames":12}],
 "topFrame":{"function":"Bomb","filename":"http://localhost:4713/base.js","in_app":true}}
```

The React 19 root unmounted (`#app` is empty afterwards), the docs' `console.warn("Uncaught error",
…)` callback ran, and the event carries the component stack as a linked `React ErrorBoundary Error`
cause. But the error that took the whole app down is `handled: true`: `reactErrorHandler` sets
`handled` to whether a callback was passed (`build/esm/error.js:31`, `mechanism: { handled:
hasCallback, type: "auto.function.react.error_handler" }`), and the guide's `onUncaughtError`
snippet passes one. `onCaughtError: Sentry.reactErrorHandler()` without a callback reports the
boundary-caught errors of the next step as `handled: false`. The two are inverted.

Replay: the first error lands within a second of page load and the buffered replay is discarded,
as in the browser run:

```
[Replay]  Converting buffer to session
[Replay]  Session duration (0s) is too short, not sending replay.
```

Events still carry `tags.replayId`; the `replay_event` (`replay_type: "buffer"`, `error_ids: 5`)
only arrived after one more error once the page had been open past `minReplayDuration` (5 s). The
verify text "including the moment the error occurred" (index.mdx:346) does not hold for the very
first click. **Partial.**

### Step 4, error boundaries (`results-error-boundary.json`, `results-error-boundary-plain.json`)

`error-boundary` uses the page's own React 19 `main.jsx` (error-boundary.mdx:27-39, all three
`reactErrorHandler` hooks) around the five boundary snippets; `error-boundary-plain` is the same App
on a plain `createRoot`, the React 18 path of error-boundary.mdx:25. Every fallback rendered and
`resetError` recovered the tree in both runs. What reached the sink differs:

```
error-boundary (React 19 main.jsx from the page):
{"exception":"React ErrorBoundary Error: Basic boundary error",   "mechanisms":["chained/true","auto.function.react.error_handler/false"],"tags":{"replayId":"…"}}
{"exception":"React ErrorBoundary Error: Sidebar boundary error", "mechanisms":["chained/true","auto.function.react.error_handler/false"],"tags":{"replayId":"…"}}
{"exception":"React ErrorBoundary Error: Custom boundary error",  "mechanisms":["chained/true","auto.function.react.error_handler/false"],"tags":{"replayId":"…"}}
console: "Not capturing exception because it's already been captured." x5

error-boundary-plain (no hooks):
{"exception":"React ErrorBoundary Error: Basic boundary error",   "mechanisms":["chained/true","auto.function.react.error_boundary/true"]}
{"exception":"React ErrorBoundary Error: Sidebar boundary error", "mechanisms":["chained/true","auto.function.react.error_boundary/true"],"tags":{"section":"sidebar","replayId":"…"}}
{"exception":"React ErrorBoundary Error: Custom boundary error",  "mechanisms":["chained/true","generic/true"]}
console: 0 dedupe lines
```

With the page's React 19 setup, React calls `onCaughtError` before the boundary's
`componentDidCatch`, so `reactErrorHandler()` captures every boundary error first, as
`auto.function.react.error_handler`, `handled: false`. The `ErrorBoundary`'s own capture, the
`beforeCapture` scope callback (error-boundary.mdx:134, 151) and `captureReactException` in the
custom boundary (error-boundary.mdx:194) then all hit "already been captured" and are dropped: the
sidebar event has no `section` tag, no event is marked as caught by a boundary, and
`captureReactException` is a no-op. Component stacks are still attached in both runs (the
`React ErrorBoundary Error` cause, `LinkedErrors`). "They complement each other"
(error-boundary.mdx:21) is the opposite of what happens: the handler wins and the boundary's
Sentry features are silenced. **Does not hold on React 19 as the page configures it; holds on the
plain root.**

### Step 5, React Router (`results-react-router-v7.json`, `results-react-router-v8.json`)

`react-router-v7` is the guide's routing snippet (index.mdx:242-264, `reactRouterV7BrowserTracingIntegration`)
plus `wrapCreateBrowserRouterV7(createBrowserRouter)` (v7.mdx:57-63) and the `errorElement` boundary
(v7.mdx:219-257, with the two verbatim breakages fixed, see step 6), on `react-router@7.18.3`,
opened at `/users/42`, then `Link`s to `/users/7`, `/boom` (a route element that throws) and `/`.
`react-router-v8` is v8.mdx:35-66 with `reactRouterBrowserTracingIntegration` and
`wrapCreateBrowserRouter` on `react-router@8.3.1`. Both behave the same:

```json
{"op":"pageload","name":"/users/:userId","status":"error","is_segment":true,"source":"route","origin":"auto.pageload.react.reactrouter_v7","url_path":"/users/42","duration_ms":243}
{"op":"navigation","name":"/users/:userId","status":"ok","is_segment":true,"source":"route","origin":"auto.navigation.react.reactrouter_v7","url_path":"/users/7","duration_ms":1001,"attributes":{"sentry.previous_trace":"5e9059b9…-9937fe53…-1"}}
{"op":"navigation","name":"/boom","status":"ok","is_segment":true,"source":"route","origin":"auto.navigation.react.reactrouter_v7","url_path":"/boom","attributes":{"sentry.idle_span_finish_reason":"cancelled"}}
{"op":"navigation","name":"/","status":"ok","is_segment":true,"source":"route","origin":"auto.navigation.react.reactrouter_v7","url_path":"/"}
{"type":"event","exception":"Error: boom route render error","mechanism":"generic","handled":true,"transaction":"/boom","topFrame":{"function":"Boom"}}
```

(v8: origins `auto.pageload.react.reactrouter` / `auto.navigation.react.reactrouter`.) Parameterized
names with `sentry.segment.name.source: route` survive the v11 low-cardinality naming, error events
carry `transaction: "/users/:userId"`, the `errorElement` boundary's `captureException` reaches
Sentry, and `sentry-trace` reached the recorder on both fetches. The deprecated v7 API works
without any runtime warning; the `@deprecated` tag is visible only in the `.d.ts`. The pages'
"`pageload`/`navigation` transactions" are `span` items here too. **Holds**, with that wording gap.

### Step 6, the React Router snippets exactly as printed (`results-react-router-v7-declarative.json`, `results-react-router-v7-useroutes.json`)

v7.mdx:71-108 (declarative mode) verbatim, `ReactDOM.render(<BrowserRouter>…</BrowserRouter>)` with
React 19.2.8:

```json
{"boot":{"sdkUp":true,"appUp":false,"pageErrorsAtBoot":["import_react_dom.default.render is not a function"]}}
{"type":"event","exception":"TypeError: import_react_dom.default.render is not a function","mechanism":"auto.browser.global_handlers.onerror","handled":false}
{"op":"pageload","name":"Pageload","is_segment":true,"source":"url","origin":"auto.pageload.react.reactrouter_v7","status":"error"}
```

`react-dom@19` has no `render` export, so the snippet throws at module evaluation (the SDK, already
initialized two statements earlier, captures its own docs' crash) and nothing renders. The
snippet also passes no container element. v6.mdx:94 and 150 and v7.mdx:155 have the same call;
v8.mdx:104 uses `ReactDOM.createRoot(...)`. **Does not run with React 19**, the React version the
guide's main page is written for.

v7.mdx:122-160 (`useRoutes`) verbatim:

```json
{"boot":{"sdkUp":false,"appUp":false,"snippetError":"ReferenceError: Sentry is not defined"}}
```

0 sink items. The snippet imports `{ wrapUseRoutes }` (v7.mdx:131) and then calls
`Sentry.init` (:133), `wrapUseRoutesV7` (:147), `ReactDOM.render` (:155) and `<BrowserRouter>`
(:156) with none of them imported; `Sentry.init` is the first `ReferenceError`. v6.mdx:126/142 has the
`wrapUseRoutes` / `wrapUseRoutesV6` mismatch and the same missing imports. **Does not run.**

v7.mdx:239-255 (the custom `errorElement` boundary), two esbuild probes:

```
src/react-router-v7/error-boundary-verbatim.jsx:7:32: ERROR: Expected ";" but found "as"
    const error = useRouteError() as Error;
same file as .tsx:  ERROR: Could not resolve "react-router-dom"
```

The block is tagged `jsx` but contains a TypeScript cast, and it imports from `react-router-dom`
while every other snippet on the page installs and imports `react-router` only. v8.mdx:246 has the
same cast (its import at :243 is `react-router`); v6.mdx:239 has the cast too. The run in step 5 used
`react-router` and dropped the cast. **Does not build as printed.**

### Step 7, component tracking (`results-profiler.json`)

component-monitoring.mdx:16-32 verbatim (`export default Sentry.withProfiler(App)`), plus two prop
changes and an unmount driven from a parent:

```json
{"op":"ui.mount", "name":"<App>","origin":"auto.ui.react.profiler","component":"App","duration_ms":1,  "parent":"98c93aea1a8765f9","segment":"Pageload"}
{"op":"ui.update","name":"<App>","origin":"auto.ui.react.profiler","component":"App","duration_ms":1,  "parent":"98c93aea1a8765f9","segment":"Pageload","changed":["tick"]}
{"op":"ui.update","name":"<App>","origin":"auto.ui.react.profiler","component":"App","duration_ms":0,  "parent":"98c93aea1a8765f9","segment":"Pageload","changed":["tick"]}
{"op":"ui.render","name":"<App>","origin":"auto.ui.react.profiler","component":"App","duration_ms":274,"parent":"98c93aea1a8765f9","segment":"Pageload"}
```

Mount, update and render spans all arrive, as children of the pageload segment span, with
`ui.component_name: App` and `ui.react.changed_props: ["tick"]`. The ops are `ui.mount`, `ui.update`
and `ui.render` (`build/esm/profiler.js` imports `UI_MOUNT`, `UI_UPDATE`, `UI_RENDER` from
`@sentry/conventions/op`), not the `ui.react.*` names the page lists at :34-46 and :66-72; the
migration page (:454) documents the rename, the feature page does not. **Partial.**

### Step 8, Redux (`results-redux.json`)

index.mdx:283-290 verbatim, `createStore(rootReducer, compose(sentryEnhancer))` on `redux@5.0.1`
(the `createStore` deprecation is a type-level strikethrough only; it runs). After
`INCREMENT` x2, `SET_PASSWORD { password: "hunter2" }` and `GOVERNMENT_SECRETS { secret: "area51" }`,
`captureException(new Error("Error with redux state"))` produced:

```json
{"type":"event","contexts":["trace","react","state","culture"],
 "state":{"type":"redux","value":{"count":2,"password":"hunter2","secret":"area51"}},
 "breadcrumbs_raw":[{"category":"redux.action","data":{"type":"INCREMENT"}},{"category":"redux.action","data":{"type":"INCREMENT"}},
                    {"category":"redux.action","data":{"type":"SET_PASSWORD","password":"hunter2"}},
                    {"category":"redux.action","data":{"type":"GOVERNMENT_SECRETS","secret":"area51"}}]}
{"type":"attachment","filename":"redux_state.json","length":50,"payload":{"count":2,"password":"hunter2","secret":"area51"}}
```

State context, action breadcrumbs and the `redux_state.json` attachment all arrive on every error
event (four attachments for four events), so the Redux step **holds**. But the `password` key is sent
in clear three times over, while the guide's data-collection step
(`getting-started-data-collection/javascript.mdx:8`) promises that "The SDK always filters sensitive
values whose keys match a built-in denylist, such as `auth` or `password`, and sends `[Filtered]`
instead." The SDK's denylist (`@sentry/core/build/esm/utils/data-collection/filterKeyValueData.js`,
`SENSITIVE_KEY_SNIPPETS`) is applied to the key-value data the `dataCollection` categories cover; it
is not applied to Redux state, to the attachment, or to breadcrumb data. The redux include's
`stateTransformer` / `actionTransformer` (:39-91) are the only way to keep such keys out.

### Step 9, not run

- **Component names** (component-names.mdx): needs `@sentry/babel-plugin-component-annotate` through
  `@sentry/vite-plugin`, `@sentry/rollup-plugin` or `@sentry/webpack-plugin`, none of which is in this
  repo's toolbox, and the page itself says esbuild, this reproduction's bundler, is not supported
  (:51). **Not run.**
- **TanStack Router** (tanstack-router.mdx): `tanstackRouterBrowserTracingIntegration` exists in the
  type surface; `@tanstack/react-router` was not installed. **Not run.**
- **React Router v3, v4/v5** and **v6**: v6 was not run on its own (see above for the shared
  verbatim breakages); v3/v4/v5 pages were not in scope.
- The Node-only install pages (`commonjs`, `esm`, `esm-without-import`, `late-initialization`,
  `lightweight`) were covered by the browser run and are not repeated.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/react --save` is all you need (index.mdx:33) | **yes** |
| The `instrument.js` snippet initializes the SDK (index.mdx:73-117) | **yes**, 16 integrations, `traceLifecycle: "stream"`, feedback widget in the DOM |
| `tracePropagationTargets: [/^\//, …]` propagates the trace (index.mdx:105) | **yes**, relative and absolute same-origin fetches both got `sentry-trace` and `baggage` |
| The verify button creates an issue with a stack trace (index.mdx:328-332, 361-370) | **yes**, `auto.browser.global_handlers.onerror`, `handled: false`, frame on `onClick` |
| "wrap the error in a span" creates the test span with the error (index.mdx:374-389) | **partial**, the span is 0 ms and `ok`; the error arrives 99 ms later via `BrowserApiErrors` and marks the pageload segment `error` |
| "page load traces and the test span" (index.mdx:338) | **partial**, both exist, as `span` items under a `Pageload` segment, no transaction envelope; index.mdx:99 still says "transactions" |
| Session Replay shows "the moment the error occurred" (index.mdx:344-346) | **partial**, the first error's buffer is discarded ("Session duration (0s) is too short"), later errors ship a replay |
| `Sentry.logger.*` reaches Sentry (index.mdx:397-401) | **yes** |
| `debug: true` shows SDK activity (index.mdx:414-419) | **partial**, integrations and lifecycle, never the SDK name or version |
| `tunnel` forwards events (index.mdx:307-312) | **yes**, every envelope of all nine runs arrived through `/tunnel` |
| React 19 hooks with `reactErrorHandler` capture render errors (index.mdx:149-174) | **yes**, with the component stack; but the fatal `onUncaughtError` event is `handled: true` because the snippet passes a callback |
| `ErrorBoundary` and `reactErrorHandler` "complement each other" in React 19 (error-boundary.mdx:21-53) | **no**, `onCaughtError` captures first, the boundary's capture, `beforeCapture` tags and `captureReactException` are deduplicated away |
| `ErrorBoundary` captures with component stack, fallback, `resetError`, `beforeCapture` tags (error-boundary.mdx:59-151) | **yes** on a plain root (`auto.function.react.error_boundary`, `handled: true`, `tags.section`) |
| `captureReactException` keeps the linked component stack (error-boundary.mdx:173-204) | **yes** on a plain root (`generic` mechanism with the `React ErrorBoundary Error` cause); silently dropped under the page's React 19 `main.jsx` |
| Routing snippet gives parameterized pageload/navigation names (index.mdx:242-264, v7.mdx:163) | **yes**, `/users/:userId` with `source: route`; they are `span` segments, not transactions; the API is `@deprecated` in the build |
| Version-agnostic APIs work with React Router v8 (v8.mdx:7-66) | **yes** |
| v7.mdx:71-108 declarative snippet runs | **no**, `ReactDOM.render is not a function` on React 19 |
| v7.mdx:122-160 `useRoutes` snippet runs | **no**, `ReferenceError: Sentry is not defined`; `wrapUseRoutes` imported, `wrapUseRoutesV7` called |
| v7.mdx:239-255 custom error boundary builds | **no**, `as Error` in a `jsx` block, `react-router-dom` not installed in a v7 project |
| `withProfiler` emits `ui.react.mount` / `ui.react.render` / `ui.react.update` (component-monitoring.mdx:34-46) | **partial**, spans arrive, ops are `ui.mount` / `ui.render` / `ui.update` |
| `createReduxEnhancer` attaches state, actions and `redux_state.json` (index.mdx:283-290, redux include :109-113) | **yes** |
| "The SDK always filters sensitive values whose keys match a built-in denylist, such as `auth` or `password`" (getting-started-data-collection/javascript.mdx:8) | **no** for Redux state, the attachment and action breadcrumbs, `password: "hunter2"` arrives in clear |
| Release Health sessions | **no**, the guide's snippet has no `release`, "Discarded session because of missing or non-string release", zero session envelopes |
| React component names via the Babel plugin (component-names.mdx) | **not run** |
| TanStack Router (tanstack-router.mdx) | **not run**, the export exists |

## Findings

1. **P0, docs wrong**, `features/react-router/v7.mdx:71-108` (and v6.mdx:64-101): the declarative
   snippet calls `ReactDOM.render(...)`, which React 19 no longer exports; it throws `TypeError:
   ReactDOM.render is not a function` at boot and renders nothing. Fix: use
   `ReactDOM.createRoot(document.getElementById("root")).render(...)` as v8.mdx:104 does.
2. **P0, docs wrong**, `features/react-router/v7.mdx:122-160` (and v6.mdx:117-155): imports
   `{ wrapUseRoutes }` but calls `wrapUseRoutesV7`, and uses `Sentry`, `ReactDOM` and `BrowserRouter`
   without importing them; `ReferenceError: Sentry is not defined`, the SDK never initializes. Fix:
   `import * as Sentry from "@sentry/react"` and call `Sentry.wrapUseRoutesV7` (or the version-agnostic
   `Sentry.wrapUseRoutes`), import `BrowserRouter` and use `createRoot`.
3. **P0, docs wrong**, `features/react-router/v7.mdx:239-255` (also v8.mdx:243-258, v6.mdx:234-250):
   the custom error boundary is a `jsx` block with a TypeScript cast (`useRouteError() as Error`),
   which esbuild rejects, and on the v7 page it imports from `react-router-dom` while the page
   installs `react-router`. Fix: drop the cast (or tag the block `tsx`) and import `useRouteError`
   from `react-router`.
4. **P1, docs wrong**, `features/error-boundary.mdx:21-53` and `:151`, `:173`: with the page's React 19
   `main.jsx` (`onCaughtError: Sentry.reactErrorHandler()`), every boundary error is captured by the
   handler first (`handled: false`) and the `ErrorBoundary`'s capture, its `beforeCapture` tags and
   `captureReactException` are dropped as duplicates. Fix: tell React 19 readers to leave
   `onCaughtError` out (or pass a callback there) when they rely on `ErrorBoundary`'s
   `beforeCapture` / `captureReactException`, and that the caught error is reported unhandled by the hook.
5. **P1, docs wrong**, `platform-includes/getting-started-data-collection/javascript.mdx:8` on the
   guide's "Control the Data You Send" step: the promised `[Filtered]` for keys like `password`
   does not apply to Redux state, the `redux_state.json` attachment or `redux.action` breadcrumbs;
   `password: "hunter2"` arrived in clear. Fix: scope the sentence to the request data the
   `dataCollection` categories cover and point the Redux step at `stateTransformer` / `actionTransformer`.
6. **P1, docs wrong**, `features/component-monitoring.mdx:34-46` and `:66-72`: the ops are
   `ui.mount`, `ui.render`, `ui.update` (span name `<App>`, `ui.component_name`), not `ui.react.*`,
   and they are children of the pageload segment span, not of "the current active transaction".
   Fix: rename the ops per migration :454 and say "active root span".
7. **P2, docs wrong**, `index.mdx:242-264` (the guide's routing step) and the "Set Up Routing"
   links: they teach `reactRouterV7BrowserTracingIntegration` / `wrapCreateBrowserRouterV7`, which
   the build marks `@deprecated` in favor of `reactRouterBrowserTracingIntegration` /
   `wrapCreateBrowserRouter`; no runtime warning tells the reader. The `@sentry/react/react-router`
   subpath with a hook-less `reactRouterBrowserTracingIntegration()` is not documented anywhere.
   Fix: switch the guide snippet to the version-agnostic API and mention the subpath.
8. **P2, docs wrong**, `index.mdx:99`, `:336-338`, `react-router/index.mdx:16`, `v7.mdx:163`,
   `v8.mdx:165`, `tanstack-router.mdx:14`: "transactions" everywhere, while develop sends `span`
   envelope items (a `pageload` / `navigation` segment named `Pageload` or `/users/:userId` plus
   children) and no `transaction` envelope. Fix: say "root spans / traces" and note that the trace
   view, not a transaction list, is where they appear.
9. **P2, docs wrong**, `index.mdx:374-389`: "wrap the error in a span" wraps nothing; the span ends
   at 0 ms and the error is thrown 99 ms later from a `setTimeout`, captured by `BrowserApiErrors`.
   Fix: make the callback `async` and `await` the delay before throwing, or say the error is
   separate from the span.
10. **P2, SDK limit**, `index.mdx:73-117`: the snippet has no `release`, and the SDK discards every
    session ("Discarded session because of missing or non-string release"); Release Health stays
    empty for a reader of this guide although `BrowserSession` is installed. Fix: add `release` to
    the snippet as the browser guide does, or a one-line note.
11. **P2, SDK limit**, `index.mdx:163-167`: `onUncaughtError: Sentry.reactErrorHandler(callback)`
    reports the error that unmounted the root as `handled: true`, because `reactErrorHandler` derives
    `handled` from whether a callback was passed, while the boundary-caught `onCaughtError` events
    are `handled: false`. Fix: drop the `console.warn` callback from the snippet, or say that a
    callback marks the error handled.
12. **P2, docs wrong**, `index.mdx:344-346`: for the very first verify click the replay is discarded
    ("Session duration (0s) is too short, not sending replay") while the event still carries a
    `replayId` tag. Fix: say to keep the page open a few seconds before clicking, or to expect the
    replay from later errors.

Not a finding, a note for the docs team: `index.mdx:48-55` offers no `logs` onboarding option while
`:350-356` and `:393-403` are gated on `optionId="logs"`; whether those blocks ever render was not
verified here (no docs build).

## Files

`package.json`, `build.mjs` (esbuild, one bundle per `src/<variant>/main.jsx`, `react-router` aliased
to `react-router-v8` for the v8 variant), `src/shared/` (`instrument.js`, the guide's config;
`VerifyButtons.jsx`, the guide's verify snippets; `harness.js`, the driver hooks), one directory per
variant under `src/`, `public/<variant>.html`, `drive.mjs` (the Playwright driver), `run.sh`, and
`sink.mjs`, a copy of `../browser/sink.mjs` extended with an SPA fallback, richer compact mappings
(linked exceptions, `contexts.react`, `contexts.state`, full span attributes, attachments) and no CDN
mount. `results-<variant>.json`, `app-<variant>.log` and `sink-<variant>.log` are the nine runs.

`node_modules/` and `dist/` are left in place from the run; the Install and Run sections recreate
them from scratch if they are removed.
