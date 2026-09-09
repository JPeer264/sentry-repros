# QS-gatsby, the Gatsby getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/gatsby`
pulls `@sentry/react`, `@sentry/core` and `@sentry/bundler-plugins` (which pulls the `sentry` CLI
`^0.44.0` from the registry) and declares peers `gatsby: ^3 || ^4 || ^5`, `react: 17.x || 18.x || 19.x`.

Google Chrome 153 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `gatsby` 5.16.1, `react` and `react-dom` 18.3.1 (the majors
Gatsby 5 scaffolds; the guide names none), node v22.23.1 (an already installed Volta version:
`gatsby@5.16.1` declares `node >=18 <26` and the shell default is v26), macOS 15.7.7. All envelopes go
to a local sink via the `tunnel` option; nothing leaves the machine except registry downloads
(`GATSBY_TELEMETRY_DISABLED=1`; see the bundler plugin telemetry note under Findings).

## What it reproduces

A new user following `docs/platforms/javascript/guides/gatsby/index.mdx` end to end. The guide
directory holds only `index.mdx` (frontmatter `sdk: sentry.javascript.gatsby`, `categories:
[javascript, browser]`, index.mdx:1-8) and `profiling/` (a `PageGrid` index plus `browser.mdx` and
`node.mdx`, not part of the getting-started path, not run).

Where each rendered include really comes from (`javascript.gatsby.mdx`, else `javascript.mdx`, else
`_default.mdx`; no `javascript.gatsby.mdx` variant exists for any of them):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:10) | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` |
| `<Include name="quick-start-features-expandable" />` (index.mdx:102) | `includes/quick-start-features-expandable.mdx:20-27`, the `javascript.gatsby` section: issues, tracing, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-sourcemaps-short-version" />` (index.mdx:162) | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx:1-19` (`npx @sentry/wizard@latest -i sourcemaps`, not run) |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:166) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22`, snippet at 14-17 |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:170) | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:189) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="logs/javascript-quick-start-verify-logs-splitlayout" />` (index.mdx:244) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:1-28`, snippet at 13-23 |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:252) | `includes/quick-start-locate-data-expandable.mdx:20-27` |

Snippets copied verbatim: install (index.mdx:34), `gatsby-config.js` CommonJS tab (index.mdx:60-68),
`sentry.config.js` (index.mdx:115-153, all four product options), the verify button
(index.mdx:194-203), the tracing verify button (index.mdx:223-234) and the logs lines
(logs include:13-23). The ESM tab of the config step (index.mdx:70-83) was not run, see Findings.
Added for the reproduction (marked in the files): `tunnel` pointed at the sink, `debug: true`,
`window.Sentry`, the driver hooks in `src/harness.js`, the `id` attributes, a fetch probe button,
Gatsby `Link`s, `src/pages/about.js` and the client-only route `src/pages/users/[id].js`
(File System Route API, `matchPath: /users/:id` in `.cache/match-paths.json`).

## Toolbox check

`tar tzf sentry-gatsby-10.67.0.tgz` lists 20 entries: `package.json`, `README.md`, `LICENSE`,
`gatsby-node.js`, `gatsby-node.d.ts` and `build/{cjs,esm,types}/` (`index.js`, `sdk.js`, maps, types).
There is no `gatsby-browser.js` and there never was one: the package's `files` list is
`/build`, `gatsby-node.js`, `gatsby-node.d.ts` (`packages/gatsby/package.json`). The plugin wires
`Sentry.init` by prepending `./sentry.config.js` (or `.ts`) to every webpack `entry`
(`gatsby-node.js:65-108`) and adds `sentryWebpackPlugin` from `@sentry/bundler-plugins/webpack` in
production builds (`gatsby-node.js:7-63`). The tarball matches the source, so the run went ahead.

## Install

```bash
cd $REPRO/quickstarts/gatsby
volta run --node 22.23.1 -- npm install --no-audit --no-fund   # package.json pins every @sentry/* to a
                                                               # pack-develop-03aaf424 tarball, repeated in `overrides`
```

`added 1373 packages in 1m` (`install.log`). npm warns about Gatsby's own
`react-server-dom-webpack@0.0.0-experimental` peer on `react@18.3.1` and deprecated transitive
packages; nothing Sentry related. Installed `node_modules/@sentry`: `browser browser-utils
bundler-plugins conventions core feedback gatsby react replay replay-canvas`; every SDK package is
`10.67.0` with `resolved: file:../../_toolbox/pack-develop-03aaf424/…` in `package-lock.json`, only
`@sentry/conventions@0.20.0` comes from the registry, and there is no nested `@sentry/*` copy. The
`sentry` CLI 0.44.1 (dependency of `@sentry/bundler-plugins`) comes from the registry.

Every export the guide's snippets use exists on `require('@sentry/gatsby')`: `init` (the package's
own, `build/types/sdk.d.ts`), `browserTracingIntegration`, `replayIntegration`,
`feedbackIntegration` (`feedbackSyncIntegration` re-exported under that name), `startSpan`,
`logger` (`fmt,debug,error,fatal,info,trace,warn`) via `export * from '@sentry/react'` and
`@sentry/browser`. None is missing, and `@sentry/browser`'s `index.d.ts` carries no `@deprecated`
marker at all.

## Run

```bash
cd $REPRO/quickstarts/gatsby
./run.sh base            # gatsby build, then /: verify buttons, Link to /users/42/, back, /about/
BUILD=0 ./run.sh client-route   # reuse public/: open /users/42/ directly, navigate home and to /about/
```

`run.sh` builds with `node_modules/.bin/gatsby build` (log in `build.log`), starts the sink on
`localhost:4768` and `gatsby serve -p 4769`, drives one headless Chrome, and writes
`results-<variant>.json` (`meta` from `Sentry.getClient()`, `steps`, `summary`, the filtered
`buildConsole`, the browser `console`, `pageErrors`, the compact sink items, the recorder headers
and the raw envelope payloads) plus `app-<variant>.log`. `diag-history.mjs` is the one-off probe
used for the navigation finding (logs `history.pushState` calls next to the SDK's debug lines).

## Expected

- index.mdx:34, `npm install @sentry/gatsby --save`; index.mdx:26, the package is a wrapper around
  `@sentry/react` and re-exports it.
- index.mdx:55, register the plugin in `gatsby-config.(js|ts)`; index.mdx:110, create
  `sentry.config.(js|ts)` in the project root with the `Sentry.init` of 115-153.
- index.mdx:137-138, "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing."
- index.mdx:182-203, the button throws and the error shows up as an issue; 216-218, wrapped in
  `Sentry.startSpan` it also produces a trace; logs include:6, the logger lines are captured.
- tunneling include:5-7, `tunnel: "/tunnel"` sends all events to that endpoint.
- The guide says nothing about the plugin's build-time behaviour (source maps, release, telemetry),
  about what `gatsby build` does with `sentry.config.js`, or about navigation instrumentation.

## Observed

### `gatsby build` (build.log, results-base.json `buildConsole`)

- Build succeeds in about 25s (`Building production JavaScript and CSS bundles - 4.1s`,
  `Building HTML renderer - 2.7s`), pages `/`, `/about/`, `/users/[id]/`.
- The webpack plugin runs in both the JavaScript and the HTML-renderer stage and prints, twice,
  `[sentry-webpack-plugin] Info: Sending telemetry data on issues and performance to Sentry. To
  disable telemetry, set options.telemetry to false.` and `Warning: No auth token provided. Will not
  create release / upload source maps`. The `errorHandler` special cases in `gatsby-node.js:44-59`
  never fire (the plugin warns instead of throwing), so the build is not broken by missing
  `SENTRY_*` variables.
- Gatsby's production config already has `devtool: 'source-map'`, so the plugin's
  "Automatically enabling source map generation" branch is not taken: 8 `.map` files stay in
  `public/`, nothing is deleted.
- The plugin injects a release from the surrounding git checkout,
  `SENTRY_RELEASE={id:"2bf9992f…"}` in `public/app-*.js`, plus debug IDs (`_sentryDebugIds`). Every
  event, session, log and span carries `release: 2bf9992f…` and `environment: production` although
  `sentry.config.js` sets neither.
- `sentry.config.js` is prepended to the `build-html` entry too, so `Sentry.init` runs inside the
  Node HTML renderer during the build: the log shows the full "Integration installed" list twice,
  `Sentry Logger [error]: Error while instrumenting history TypeError: WINDOW.addEventListener is
  not a function`, `Using the browserSessionIntegration in non-browser environments is not
  supported` and `[Tracing] Could not set up background tab detection due to lack of global
  document`. The build still completes. Anything browser-only a user adds to `sentry.config.js`
  (this repro's `window.Sentry = …` had to be guarded) breaks `gatsby build`.

### base (`results-base.json`, `app-base.log`)

- `Sentry.getClient()` is up before the page is wired; `sdk.name: sentry.javascript.gatsby`,
  `version 10.67.0`, `packages: [npm:@sentry/gatsby 10.67.0]`. Integrations: EventFilters,
  FunctionToString, ConversationId, BrowserApiErrors, Breadcrumbs, GlobalHandlers, LinkedErrors,
  Dedupe, HttpContext, CultureContext, BrowserSession, BrowserTracing, Replay, Feedback,
  SpanStreaming, WebVitals. Options: `traceLifecycle: stream`, `tracesSampleRate: 1`,
  `tracePropagationTargets` unset, `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1`.
  The feedback widget (`#sentry-feedback`) is rendered.
- `#btn-throw` (index.mdx:194-203) and `#btn-span` (index.mdx:223-234): two `event` items,
  `Error: Sentry Test Error`, mechanism `auto.browser.browserapierrors.addEventListener`,
  `handled: false`, top frame `onClick` in `component---src-pages-index-js-*.js` (`in_app: true`),
  contexts `trace`, `react` (`{version: "18.3.1"}`), `culture`, `transaction: "/"`, `debug_meta`
  with the injected debug IDs. Both are in the pageload trace. The startSpan variant also produces a
  child span `test Example Frontend Span` with `status: error`, and the pageload segment ends with
  `status: error` / `sentry.status.message: internal_error`.
- `#btn-log` (logs include:13-23): one `log` item with `info: User example action completed`,
  `warn: Slow operation detected`, `error: Validation failed`, attributes preserved, without any
  `enableLogs` option in the snippet.
- `#btn-fetch`: `http.client GET localhost` child spans for the same-origin `page-data.json` and the
  cross-origin `localhost:4768/recorder`. The recorder saw **no** `sentry-trace`/`baggage`: with
  `tracePropagationTargets` unset this build attaches headers to same-origin requests only
  (`shouldAttachHeaders` in `@sentry/browser/build/npm/esm/prod/tracing/request.js`), and another
  port is another origin.
- Sentinel arrives; then the pageload segment: envelope item type `span`, `op: pageload`,
  **name `Pageload`**, `sentry.segment.name.source: url`, `url.path: /`, `url.full:
  http://localhost:4769/`, `sentry.trace_lifecycle: stream`, web vitals as attributes, children
  `browser.*`, `resource.script`, `http.client`, `ui.webvital.lcp`, `ui.webvital.cls`. No
  `transaction` envelope item exists anywhere in either run.
- Gatsby's link prefetches after the pageload ended arrive as their own segments: `http.client GET
  localhost` with `is_segment: true`, `source: custom` (`page-data/app-data.json`,
  `page-data/users/[id]/page-data.json`).
- `Link` to `/users/42/`, back to `/`, then `/about/`: three `navigation` segments, all named
  `Navigation` (`source: url`, the path only in `url.path`), each linked to the previous trace
  (`sentry.previous_trace`). `params.id` renders `42`.
- Sessions: `init` session `status: ok`, then an update `status: unhandled, errors: 1`. Replay:
  buffer mode, `replay_event` + `replay_recording` arrive after the extra error and the 5s minimum
  duration. Console: 123 lines, 122 of them `Sentry Logger` debug output, plus one
  `Failed to load resource: 404` (`/favicon.ico`, the site has no favicon or 404 page).

### client-route (`results-client-route.json`, `app-client-route.log`)

- Opening `/users/42/` directly: `gatsby serve` serves `public/users/[id]/index.html` through the
  matchPath, the client renders `42`, but the build-time HTML was rendered with `params.id` =
  `[id]`, so React 18 logs hydration errors #425, #418, #423 (a Gatsby File System Route
  behaviour, not Sentry's). Sentry captures them as three `event` items (mechanism
  `auto.browser.global_handlers.onerror`, `handled: false`, `transaction: /users/42/`); Dedupe drops
  the repeated #418 (`Event dropped due to being a duplicate`).
- Pageload segment `Pageload`, `url.path: /users/42/`, `source: url`: the raw id is in the
  attributes, there is no parameterized `/users/:id` anywhere (no Gatsby routing integration exists).
- The first client-side navigation on that document, a `Link` click to `/`, produced **no**
  `navigation` segment within 15s although the URL and page changed (`steps[1].navSpan: false`);
  the second navigation, `window.___navigate('/about/')`, did (`steps[2]`). After a reload of
  `/users/42/`, a programmatic first navigation to `/about/` was classified by the SDK as a redirect
  (`[Tracing] Detected redirect, navigation span will not be the root span, but a child span`,
  `op: navigation.redirect` child of the pageload) and again produced no segment. `diag-history.mjs`
  confirms Gatsby calls `history.pushState(state, null, '/about/')` exactly once for such a
  navigation, from both `/` and `/users/42/`. The dropped first `Link` navigation is reproduced but
  its cause is not pinned down here.

## Findings

1. **P2, docs wrong**: the ESM tab of the register step (index.mdx:70-83) is TypeScript
   (`import type { GatsbyConfig } from "gatsby"`, `const config: GatsbyConfig`) under the filename
   `gatsby-config.(js|ts)`. As a `.js` (or `.mjs`) file it is a syntax error; only `gatsby-config.ts`
   can hold it. Not run; the CommonJS tab was used.
2. **P2, docs wrong**: index.mdx:137-138 says `tracesSampleRate: 1.0` captures "100% of
   transactions". This build never sends a `transaction` item; pageloads and navigations arrive as
   `span` envelope items (segments) named `Pageload` / `Navigation`, and the UI-facing name a user
   would look for is in `url.path`.
3. **P2, docs wrong**: the Logs verify step (index.mdx:242-246) is wrapped in
   `<OnboardingOption optionId="logs">` but `logs` is not one of the page's options
   (index.mdx:93-100), so the section is always shown regardless of the selection; it does work
   without extra configuration (logs are on by default in this build).
4. **P2, SDK limit**: `sentry.config.js` runs in Node during `gatsby build` (the plugin prepends it
   to the `build-html` entry as well, `gatsby-node.js:87-108`), producing an SDK `[error]` and two
   `[warn]` lines per build and breaking the build if the file touches `window`. The guide does not
   mention that the file must be SSR-safe.
5. **P2, SDK limit**: the guide's install step silently adds the Sentry webpack plugin to every
   production build: `Sending telemetry data on issues and performance to Sentry` (opt-out only via
   plugin options not shown anywhere), a release derived from the enclosing git checkout, debug-ID
   injection, and two "No auth token provided" warnings. None of this is mentioned; the sourcemaps
   step points at the wizard instead.
6. **P2, SDK limit**: the first client-side navigation after landing on a client-only route produced
   no `navigation` segment (Link click, `results-client-route.json` steps[1]); a programmatic first
   navigation is dropped as a "redirect". Subsequent navigations work.
7. **P2, SDK limit**: with the snippet's defaults, cross-origin requests (another port of
   `localhost` included) get no `sentry-trace`/`baggage`, and Gatsby's own prefetches outside a
   pageload/navigation become standalone `GET localhost` segments.

## Cleanup

Every `gatsby serve`, sink and Chrome started by `run.sh` and `diag-history.mjs` is killed at the
end of the script; `pgrep -fl "gatsby serve|sink.mjs|drive.mjs"` was empty after the last run.
`node_modules/`, `.cache/` and `public/` are left in place.
