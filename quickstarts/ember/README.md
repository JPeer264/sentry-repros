# QS-ember, the Ember getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/ember` is a
**v2 Ember addon** on this branch (`ember-addon.version: 2`, `addon-main.cjs` via `@embroider/addon-shim`,
`dist/index.js`, `declarations/`), depending on `@sentry/browser 10.67.0`, `@sentry/core 10.67.0`,
`@sentry/conventions ^0.20.0`, `@embroider/addon-shim`, `@embroider/macros`, `decorator-transforms`.
`tar tzf sentry-ember-10.67.0.tgz` lists `package/addon-main.cjs`, `package/dist/index.js`,
`package/declarations/**`, `package/src/**`, `package/package.json`, `package/README.md`: complete for a
v2 addon (v2 addons ship `dist/`, not `addon/`; there is no `blueprints/` directory), so nothing had to
be repacked from the worktree.

App: `npx ember-cli@7.2.0 new qs-ember --skip-git --skip-npm --directory=.`, which is the Vite blueprint
(`vite.config.mjs`, `@embroider/vite`, `ember-source ~7.2.0`, `vite ^8.2.1`, `app/templates/application.gjs`).
Built with `./node_modules/.bin/ember build --environment=production` (9 s, one rolldown chunk-size
warning, nothing from the addon). Google Chrome 153.0.8010.37 driven by `playwright-core` 1.63.0
(`chromium.launch({ channel: 'chrome', headless: true })`, no browser download), node v26.5.0,
macOS 15.7.7 (Darwin 24.6.0). All envelopes go to a local sink through the guide's `tunnel: "/tunnel"`;
nothing leaves the machine.

## What it reproduces

A new user following `docs/platforms/javascript/guides/ember/index.mdx` end to end, plus the two feature
pages under `guides/ember/`. The page's frontmatter carries `sdk: sentry.javascript.ember` and
`categories: [javascript, browser]` (index.mdx:4-7).

Where each rendered include really comes from (`javascript.ember.mdx`, else `javascript.mdx`, else `_default.mdx`):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:11) | `platform-includes/getting-started-prerequisites/javascript.ember.mdx:1-7` (Ember `4.0.0` or above) |
| `<PlatformContent includePath="getting-started-install" />` (index.mdx:27) | `platform-includes/getting-started-install/javascript.ember.mdx:1-3`, `ember install @sentry/ember` |
| `<PlatformContent includePath="getting-started-sourcemaps-short-version" />` (index.mdx:114) | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx` (not run) |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:118) | `platform-includes/getting-started-tunneling/javascript.mdx:13-18`, `tunnel: "/tunnel"` |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:122) | `platform-includes/getting-started-data-collection/javascript.mdx` (not run) |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:136) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `configuration/ember-options.mdx` | its own snippets, lines 10-17, 21-25, 33-37, 43-54, 60-64, 68-72, 78-82, 86-90 |
| `tracing/instrumentation/automatic-instrumentation.mdx` | one sentence (line 9); the tracing pages it is linked from render `platform-includes/performance/enable-tracing/javascript.ember.mdx:1-3` and `platform-includes/performance/enable-automatic-instrumentation/javascript.ember.mdx:1-21` |
| stream mode page for Ember | `platform-includes/performance/enable-stream-mode/javascript.ember.mdx:5-21` |

Snippets copied verbatim: `app/app.js` (index.mdx:60-105, all four product options) plus the tunneling
line, the verify button (index.mdx:141-146, given `id="btn-throw"`), the tracing controller
(index.mdx:191-206), the wrapped route (ember-options.mdx:43-54). Harness additions, all marked in the
files: `debug: true`, `window.Sentry` / `__qsSentinel` / `__qsMeta` hooks after `Sentry.init`, a
`/users/:user_id` route with a `LinkTo`, a `Hello` Glimmer component whose render takes 6 ms, a fetch
probe (`#btn-fetch`, relative and absolute same-origin `/recorder`), and the generated
`application.gjs` replaced by the guide's classic `application.hbs` + controller.

## Install

```bash
cd $REPRO/quickstarts/ember
npm install --no-audit --no-fund   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
                                   # in devDependencies (where `ember install` puts addons) and repeats them in `overrides`
```

`added 1308 packages in 58s`, no peer complaints. `node_modules/@sentry`: `browser browser-utils
conventions core ember feedback replay replay-canvas`, all SDK packages `10.67.0` with
`resolved: file:../../_toolbox/pack-develop-03aaf424/…` in `package-lock.json`; only
`@sentry/conventions@0.20.0` comes from the registry (`grep -c registry.npmjs.org/@sentry package-lock.json` is 0,
conventions resolves through the registry mirror). `ember install @sentry/ember` (the guide's
command) is `npm install --save-dev @sentry/ember` plus the addon's default blueprint; the tarball has no
`blueprints/`, so the file: spec is equivalent.

Every export the docs snippets use exists in `node_modules/@sentry/ember/declarations/index.d.ts`:
`init`, `instrumentRoutePerformance`, `browserTracingIntegration`, `instrumentAppInstancePerformance`,
and `replayIntegration`, `feedbackIntegration`, `startSpan`, `captureException`, `captureMessage`,
`spanStreamingIntegration` via `export * from '@sentry/browser'`. **None is `@deprecated`.** Two things the
docs use do **not** exist: the `browserTracingOptions` init option
(enable-automatic-instrumentation include:17-19; not in `BrowserOptions` nor the addon declarations) and
every `ENV["@sentry/ember"]` config key (`disablePerformance`, `disableRunloopPerformance`,
`disableInstrumentComponents`, `minimumComponentRenderDuration`, `minimumRunloopQueueDuration`;
ember-options.mdx:21-90). The last four survive only as options of `instrumentAppInstancePerformance(appInstance, {...})`
(`declarations/utils/browserTracingIntegration.d.ts`), which no docs page mentions; `disablePerformance` has no replacement
(leave the instance initializer out).

## Run

```bash
cd $REPRO/quickstarts/ember
./run.sh verbatim   # index.mdx:60-105 replaces app/app.js whole-file (the guide's wording)
./run.sh base       # generated app/app.js + the guide's import and Sentry.init merged in, no instance initializer
./run.sh perf       # base + app/instance-initializers/sentry-performance.js (packages/ember/UPGRADE.md:74-85)
# STAGE=build ./run.sh <variant> / STAGE=drive ./run.sh <variant> run one half each (both stay under 3 minutes)
```

Each run copies `variants/<variant>/app.js` into `app/`, builds `dist/`, starts the sink on
`localhost:4766` (it also serves `dist/` with an SPA fallback, so the same-origin `tunnel: "/tunnel"` is
verbatim; port 4767 was reserved for a separate static server and not needed), drives one headless
Chrome through `#btn-throw`, `#btn-fetch`, `#nav-user` (`/users/42`), `#nav-home`, triggers the sentinel
(`captureMessage('sentinel')` + `sentinel-span`) and polls `/__items` for it (60 s deadline), then waits
(bounded) for the pageload / navigation spans and one replay envelope, and writes `results-<variant>.json`
(`meta` from `Sentry.getClient()`, `steps`, `summary`, `console`, `pageErrors`, `build` log, compact sink
items, recorder headers, raw envelopes). Console output is also in `app-<variant>.log`, the build output
in `build-<variant>.log`. Nothing sleeps.

## Observed

Installed integrations (`meta.integrations`, base): `EventFilters, FunctionToString, ConversationId,
BrowserApiErrors, Breadcrumbs, GlobalHandlers, LinkedErrors, Dedupe, HttpContext, CultureContext,
BrowserSession, Replay, Feedback`; the client adds `SpanStreaming` after setup (events list it, the
console logs `Integration installed: SpanStreaming` before the first span). `perf` adds `BrowserTracing`
and `WebVitals`. SDK name `sentry.javascript.ember`, version `10.67.0`, package `npm:@sentry/ember`,
`traceLifecycle: "stream"`.

**verbatim** (`results-verbatim.json`): the page boots the SDK (feedback widget present) and then Ember
throws `TypeError: Cannot read properties of undefined (reading 'entries')` from `buildRegistry`
(`Application.create` path) before rendering anything: `body` is empty, no `.ember-application`. The only
error event is Sentry capturing that boot failure (`auto.browser.global_handlers.onerror`, handled false).
Cause: index.mdx:60-105 sets `Resolver = Resolver` (the ember-cli 7.2 app needs
`Resolver.withModules(compatModules)` from `@embroider/virtual/compat-modules`) and never calls
`loadInitializers` (it only imports it); it also drops `@warp-drive/ember/install` and the inspector setup
of the generated file. Sentinel and replay still arrive because the SDK itself is fine.

**base** (`results-base.json`): item types `event, span, event, span, event, replay_event, replay_recording`.
The verify click sends `Error: Sentry Test Error` (mechanism `auto.browser.browserapierrors.setTimeout`,
handled false, transaction unset) and a `span` envelope with the segment `test Example Span`
(source custom, origin manual), never a `transaction` item. No `pageload` or `navigation` span, no
`sentry-trace` / `baggage` on either `/recorder` request, and the four `instrumentRoutePerformance` hook
spans are dropped (`Recording outcome: "no_parent_span:span"` x4) because the guide's `Sentry.init` with
`tracesSampleRate: 1.0` installs no `BrowserTracing` integration: the v2 addon does not add it. Replay
(`replay_event` + `replay_recording`) arrives after the extra error once the session is 5 s old. No
`session` item: `Sentry Logger [warn]: Discarded session because of missing or non-string release` (twice).
One console 404 is `/favicon.ico` (the blueprint ships none). No Ember warnings, no addon build warnings.

**perf** (`results-perf.json`): item types `event, span, event, span, span, span, event, replay_event,
replay_recording`. Spans (all `span` envelope items, `is_segment` marks the roots):
`pageload route:index` (segment, source route, origin `auto.pageload.ember`, `url.path /`, `url.template /`)
with `router Router` (origin `auto.ui.ember`, the low-cardinality fallback name under streaming),
`browser.*`, `resource.*`, `ui.webvital.lcp`, `ui.webvital.cls` children; `navigation route:user`
(segment, source route, origin `auto.navigation.ember`, `url.path /users/42`, `url.template /users/:user_id`)
with `router Router`, four `function user` spans (`code.function.name` beforeModel / model / afterModel /
setupController, origin `auto.ui.ember`) and one `ui.task runloop` (`ember.runloop.queue: render`, 7 ms);
`navigation route:index`; two `http.client GET localhost` roots for the fetch probe, and both `/recorder`
requests carried `sentry-trace` and `baggage` (`sentry-transaction=route%3Aindex`). The error event now has
`transaction: route:index`. Not seen: any `ui.render` component span (a Glimmer component with a 6 ms
render, on an `ember-source` 7.2 production build) and the `ui.mount init` initial-load span (it needs
`@sentry/ember:initial-load-start/end` performance marks that the v2 addon no longer injects).

## Findings

- **P0, docs wrong**, index.mdx:60-105: copying the `app/app.js` snippet as the file breaks an
  `ember-cli 7.2.0` app (blank page, `TypeError … reading 'entries'` in `buildRegistry`): plain `Resolver`
  instead of `Resolver.withModules(compatModules)`, and `loadInitializers` imported but never called.
  Fix: show only the two additions (the import and `Sentry.init(...)` above the class) and tell the reader
  to keep the rest of the generated file.
- **P1, docs wrong**, ember-options.mdx:19-37, 58-90; enable-tracing include:1; enable-automatic-instrumentation
  include:1-21: the v2 addon reads no `ENV["@sentry/ember"]` section, has no `disablePerformance`, does not
  "sideload tracing as a chunk", is not "enabled by default", and `browserTracingOptions` is not an init option.
  With the guide's init a user gets no pageload / navigation spans and no trace propagation (base). Fix:
  replace the `ENV` snippets with the instance initializer calling `instrumentAppInstancePerformance(appInstance, {...})`
  and its options.
- **P1, docs wrong**, enable-automatic-instrumentation include:3 ("`pageload` and `navigation` transactions"),
  index.mdx:83-84 ("capture 100% of transactions"), enable-stream-mode include:5 ("Opt in by adding
  `spanStreamingIntegration()`"): on this build `traceLifecycle` defaults to `stream`, `SpanStreaming` is
  installed by the client, and every root arrives as a `span` envelope item, never as a `transaction`.
  Fix: describe segments / spans, say stream mode is the default and `traceLifecycle: "static"` is the opt-out.
- **P2, docs wrong**, enable-tracing include:1 links `#performance-monitoring-considerations`, the heading
  on ember-options.mdx:29 is "Tracing Considerations" (`#tracing-considerations`). Fix the anchor.
- **P2, docs wrong**, tracing/instrumentation/automatic-instrumentation.mdx:9: the page both includes send
  users to for "options to Ember's default tracing integration" is one sentence. Fix: document the
  instance initializer and its options there.
- **P2, docs wrong**, index.mdx:141 (`application.hbs`) and 162 (`application.js` controller): ember-cli 7.2
  generates `app/templates/application.gjs`; the classic template + controller works once the `.gjs` file is
  replaced, the page does not say so. Fix: mention the `.gjs` route template or show a `.gjs` version.
- **P2, SDK limit**, ember-options.mdx:56-64: component render spans never appeared for a Glimmer component
  (6 ms render) on ember-source 7.2 production; the page only promises classic components and a new app has
  none. Fix: say component spans need classic components, or drop the section.
- **P2, SDK limit**: no `session` items with the guide's init because it sets no `release`
  ("Discarded session because of missing or non-string release"). Fix: add `release` to the snippet or a
  note that Release Health needs it.
- **P2, SDK limit**: the initial-load (`ui.mount init`) span is never emitted by the v2 addon (no
  `@sentry/ember:initial-load-*` marks); nothing in the guide mentions it either.

Works as documented: `ember install`-equivalent install, `ember build --environment=production` with the
v2 addon, the verify button and the tracing verify snippet (error event + `Example Span`),
`instrumentRoutePerformance` (once a root span exists), replay and feedback wiring, the `tunnel` option.
