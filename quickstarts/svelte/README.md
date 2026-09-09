# QS-svelte, the Svelte getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/svelte`
pulls `@sentry/browser`, `@sentry/core`, `@sentry/conventions@^0.20.0` and `magic-string@~0.30.0`
(for the preprocessor) and declares the peer `svelte: 3.x || 4.x || 5.x`.

Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `esbuild` 0.25.9 with `esbuild-svelte` 0.9.5 (production
bundles, `MODE=development` compiles with Svelte's `dev: true`), `svelte` 5.57.0 from the registry,
node v26.5.0, macOS 15.7.7 (Darwin 24.6.0). All envelopes go to a local sink on `localhost:4720`
via the `tunnel` option; nothing leaves the machine.

No Vite: `build.mjs` imports the variant's `svelte.config.js` (the file the feature page tells you
to write) and hands its `preprocess` and `compilerOptions` to `esbuild-svelte`, which is what
`@sveltejs/vite-plugin-svelte` does with the same file. Components use Svelte 5 syntax (`mount`,
`$state`, `$props`, `onclick`); one component per tracking variant is written without runes so the
legacy-mode lifecycle can be compared.

## What it reproduces

A new user following `docs/platforms/javascript/guides/svelte/index.mdx` end to end, then the
feature pages under `guides/svelte/features/`. There is no `config.yml` in `guides/svelte/`; the
page's frontmatter carries `sdk: sentry.javascript.svelte` and `categories: [javascript, browser]`
(index.mdx:4-7).

Where each rendered include really comes from (`javascript.svelte.mdx`, else `javascript.mdx`, else
`_default.mdx`; no `javascript.svelte.mdx` exists for any include the guide references):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:12) | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` |
| `<Include name="quick-start-features-expandable" />` (index.mdx:58) | `includes/quick-start-features-expandable.mdx:20-27`, the section listing `javascript.svelte`: issues, tracing, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-sourcemaps-short-version" />` (index.mdx:183) | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx:1-19` (wizard only, not run) |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:187) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22`, snippet at 14-17 |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:191) | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:209) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="logs/javascript-quick-start-verify-logs-splitlayout" />` (index.mdx:291) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:1-28`, snippet at 12-24 |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:300) | `includes/quick-start-locate-data-expandable.mdx:20-27` |

The guide's own snippets that were copied verbatim: install (index.mdx:30), `main.js` for Svelte v5+
(index.mdx:69-122, all four product options), tunneling (tunneling include :14-17), the Issues verify
button (index.mdx:214-223, Svelte v5+ tab), the Tracing verify button (index.mdx:254-267, Svelte v5+
tab, plus a copy with `onclick`) and the logs lines (logs include :12-24). The Svelte v3-v4 tabs
(index.mdx:124-175, 225-234, 269-282) were not run: they are separate tabs for older Svelte majors,
Svelte 5 is what `npm install svelte` gives today, and `new App(...)` is not a Svelte 5 API.

Feature pages: `features/component-tracking.mdx` (18-27 as `svelte.config.js`, 35-61 as
`svelte.config.options.js` with the components named after the page's own array, 80-95 as
`src/track-component/MyComponent.svelte`). `features/index.mdx` is a `<PageGrid />` only.

`src/base/SomeComponent.svelte` carries the guide's verify buttons: `#btn-throw` (index.mdx:214-223),
`#btn-span` (index.mdx:254-267 verbatim, `onClick`), `#btn-span-fixed` (the same with `onclick`),
`#btn-log` (logs include :12-24) and `#btn-fetch`, a probe that fetches `/recorder?from=relative` and
`<origin>/recorder?from=absolute` so the sink can record whether `sentry-trace` / `baggage` reached it
under the guide's `tracePropagationTargets: ["localhost", ...]`. The run ends with
`window.__qsSentinel('sentinel')`, `captureMessage` plus a `sentinel-span`, and polls the sink for
both; nothing sleeps, and `drive.mjs` gives up at a 60 s deadline.

## Install

```bash
cd $REPRO/quickstarts/svelte
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
              # and repeats them in `overrides`
```

`added 32 packages, and audited 33 packages in 8s`, no peer complaints. Installed tree
(`node_modules/@sentry`): `browser browser-utils conventions core feedback replay replay-canvas svelte`;
all SDK packages `10.67.0` with `resolved: file:../../_toolbox/pack-develop-03aaf424/...` in
`package-lock.json`, plus `@sentry/conventions@0.20.0` from the registry. `svelte`, `esbuild`,
`esbuild-svelte`, `playwright-core` and `magic-string` come from the registry.

Every export the docs snippets use exists in `node_modules/@sentry/svelte/build/types/index.d.ts`:
`init`, `trackComponent`, `withSentryConfig`, and `browserTracingIntegration`, `replayIntegration`,
`feedbackIntegration`, `startSpan`, `logger` via `export * from '@sentry/browser'`. **None is missing
and nothing in `build/types/*.d.ts` is marked `@deprecated`.** `withSentryConfig` imports in Node
(`import('@sentry/svelte')` from `build.mjs`), so the `svelte.config.js` pattern works outside Vite.

## Run

```bash
cd $REPRO/quickstarts/svelte
./run.sh base                        # index.mdx main.js (Svelte v5+ tab, all options) + verify snippets
MODE=development ./run.sh base       # the same compiled with Svelte dev mode, results-base-dev.json
./run.sh component-tracking          # component-tracking.mdx:18-27, svelte.config.js = withSentryConfig(config)
./run.sh component-tracking-options  # component-tracking.mdx:35-61, trackComponents: ["Navbar", "PrimaryButton", "LoginForm"]
./run.sh track-component             # component-tracking.mdx:80-95 by hand, plus trackUpdates: true on a runes and a legacy component
```

Each run builds `dist/<variant>.js` (and `dist/<variant>.build.json` with the Svelte and esbuild
warnings), starts the sink and static server on `localhost:4720`, drives one headless Chrome through
the buttons, triggers the sentinel and polls `/__items` for it, waits for the pageload segment span,
runs the variant-specific steps, and writes `results-<variant>.json` (`meta` from
`Sentry.getClient()`, `build`, `steps`, `summary`, `console`, `pageErrors`, `compiledOnClick`, the
compact sink items, the recorder headers and the raw envelope payloads). The browser console is also
in `app-<variant>.log`, the sink's 404s in `sink-<variant>.log`.

## Expected

**Install and configure**

- index.mdx:30, `npm install @sentry/svelte --save`.
- index.mdx:64 and 69-122, `main.js`: `Sentry.init({ dsn, integrations: [browserTracingIntegration(),
  replayIntegration(), feedbackIntegration({ colorScheme: "system" })], tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/], replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0 })` before `mount(App, { target })`. No `release`, no `enableLogs`.
- index.mdx:96-97, "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing."
- tunneling include :14-17, `tunnel: "/tunnel"`.

**Verify**

- index.mdx:203 and 214-223: a button whose `onclick` throws `Error("Sentry Frontend Error")` creates an issue.
- index.mdx:247-249 and 254-267: the button updated to `Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, ...)`
  "start[s] a performance trace to measure the time it takes for the execution of your code" and
  triggers "a frontend error and performance trace" when clicked.
- logs include :6, `Sentry.logger.info/warn/error` lines are caught as logs.
- index.mdx:298, data shows up in the project (here: the sink).

**Component tracking (`features/component-tracking.mdx`)**

- :16-29, wrapping `svelte.config.js` in `withSentryConfig(config)` inserts the preprocessor, which
  injects a `trackComponent` call into every component's `<script>`.
- :33, all components are tracked by default; :51 limits tracking to the named components; :54 and
  :57 say `trackInit` and `trackUpdates` are both "optional, defaults to `true`".
- :64-74, the spans are `ui.svelte.init` (instance creation to `onMount`) and `ui.svelte.update`
  (`beforeUpdate` to `afterUpdate`), "added to the ongoing transaction".
- :78-95, `Sentry.trackComponent({ trackInit: true, trackUpdates: false, componentName: 'MyAwesomeComponent' })`
  in a component's `<script>` tracks that component without the preprocessor; :87 again says
  `trackUpdates` "defaults to `true`".

## Observed on 2026-09-09

### Step 1, install

Works as printed. Tarball provenance and versions are under Install above.

### Step 2, configure (`results-base.json`)

`Sentry.getClient()` after `mount`: `sdk.name = sentry.javascript.svelte`, `version = 10.67.0`,
`packages = [npm:@sentry/svelte 10.67.0]`, `traceLifecycle = "stream"`, Svelte 5.57.0. Installed
integrations: `EventFilters, FunctionToString, ConversationId, BrowserApiErrors, Breadcrumbs,
GlobalHandlers, LinkedErrors, Dedupe, HttpContext, CultureContext, BrowserSession, BrowserTracing,
Replay, Feedback, SpanStreaming, WebVitals`. The feedback widget host `#sentry-feedback` is in the DOM.
No page error at boot, no Svelte compiler warning, no esbuild warning.

Console at boot (besides the `Integration installed` lines): `[Tracing] Starting sampled root span
op: pageload name: Pageload`, `[Replay] Starting replay in buffer mode`, and twice
`Sentry Logger [warn]: Discarded session because of missing or non-string release`. The guide's
`main.js` sets no `release`, so no `session` item ever reaches the sink (`summary.sessions: []`).
The only other console line is a 404 for `/favicon.ico` (`sink-*.log`), which the page does not ship.

### Step 3, verify (`results-base.json`, `results-base-dev.json`)

- `#btn-throw` (index.mdx:214-223): one `event`, `Error: Sentry Frontend Error`, mechanism
  `auto.browser.browserapierrors.addEventListener`, `handled: false`, `transaction: /base.html`,
  breadcrumb `ui.click: body > div#app > button#btn-throw[type="button"]`. The pageload segment
  is then set to `internal_error` (`[Tracing] Root span: internal_error -> Global error occurred`).
- `#btn-span` (index.mdx:254-267 verbatim, `onClick`): **nothing**. The rendered element has only
  `id` and `type` attributes (`getAttributeNames()`), no `onclick` attribute or property, and the
  click sends no event and no span (`errorsSoFar` stays 1, no `Example Frontend Span` from it).
  `dist/base.js` shows why: Svelte 5 compiled `onClick={...}` into `event("Click", button_1, () => {...})`,
  an `addEventListener("Click", ...)` for an event that never fires. Neither the compiler nor
  Svelte's dev mode (`results-base-dev.json`, identical outcome) warns about it.
- `#btn-span-fixed` (the same snippet with `onclick`): one `span` item `test Example Frontend Span`
  (`origin: manual`, `duration_ms: 0`, child of the pageload segment because the idle pageload span
  was still active) and, 99 ms later, one `event` `Error: Sentry Frontend Error` with mechanism
  `auto.browser.browserapierrors.setTimeout`. The span ends when the synchronous callback returns,
  so it measures the `setTimeout` call, not the code that throws.
- `#btn-log`: one `log` item with `info: User example action completed`, `warn: Slow operation
  detected`, `error: Validation failed`, without `enableLogs` in the config.
- `#btn-fetch`: both fetches reached `/recorder` with `sentry-trace: <trace_id>-<span_id>-1` and a
  `baggage` header (`sentry-sampled=true`, `sentry-sample_rate=1`, `sentry-replay_id=...`); two
  `http.client GET localhost` spans under the pageload segment.
- Pageload: one `span` envelope with 16 spans, segment `pageload` named `Pageload`,
  `sentry.source: url`, `url.path: /base.html`, status `error`, children `browser.*`, `resource.*`,
  `browser.paint`, the two `http.client` spans, `Example Frontend Span` and `sentinel-span`.
  **No `transaction` envelope item exists anywhere in the run.**
- Replay: `[Replay] Converting buffer to session` on the first error, `Session duration (0s) is too
  short, not sending replay`; after one more error and the 5 s `minReplayDuration`, one
  `replay_event` (`replay_type: buffer`) plus `replay_recording` arrived.

Final sink item types for `base`: `event, event, event, span, log, event, replay_event, replay_recording`.

### Step 4, component tracking (`results-component-tracking.json`, `results-component-tracking-options.json`)

`svelte.config.js` = `withSentryConfig({ compilerOptions: {} })`: `build.preprocessors` lists
`FIRST_PASS_COMPONENT_TRACKING_PREPROCESSOR`, the build has no warning, and after the pageload
segment arrived the sink holds four component spans, all children of the pageload segment with
`sentry.origin: auto.ui.svelte`: `ui.mount <Navbar>` (a component without a `<script>` tag, so the
preprocessor's markup hook added one), `ui.mount <PrimaryButton>` (runes), `ui.mount <LoginForm>`
(legacy), `ui.mount <App>`, 1-3 ms each. **The op is `ui.mount`, not `ui.svelte.init`**
(`@sentry/conventions@0.20.0`: `UI_MOUNT = "ui.mount"`, `UI_UPDATE = "ui.update"`).

Two clicks on `#btn-update` re-render `App` (`renders` goes to 2) and produce **no update span**:
the shipped default is `trackUpdates: false` (`node_modules/@sentry/svelte/build/esm/preprocessors.js:3-7`
and `performance.js:9-12`), not `true` as component-tracking.mdx:57 and :89 say.

`svelte.config.options.js` (component-tracking.mdx:35-61 verbatim): only `ui.mount <Navbar>`,
`<PrimaryButton>`, `<LoginForm>` arrive, `App` is not tracked, matching :51.

### Step 5, `trackComponent` by hand (`results-track-component.json`)

`MyComponent.svelte` (component-tracking.mdx:80-95 verbatim): `ui.mount <MyAwesomeComponent>` under
the pageload segment, so the manual call and the custom name work.

`RunesCounter.svelte` (`$props`, `trackUpdates: true`): its `ui.mount` span arrives, then the console
shows `Sentry Logger [warn]: Cannot track component updates. This is likely because you're using
Svelte 5 in Runes mode. Set trackUpdates: false in withSentryConfig or trackComponent to disable this
warning.` (only with `debug: true`) and no update span ever arrives for it.

`LegacyCounter.svelte` (`export let value`, `trackUpdates: true`): `ui.update <LegacyCounter>` under
the pageload segment at first render, and another `ui.update <LegacyCounter>` under the
`ui.action.click update-click` segment after the prop change was flushed inside that span. Update
spans therefore exist on develop, but only for legacy-mode components and only while a span is
active (`onlyIfParent: true`).

### Does each claim hold on develop?

| Claim | Holds? |
| --- | --- |
| index.mdx:30, install | yes |
| index.mdx:69-122, `main.js` initializes and mounts | yes |
| index.mdx:96-97, "100% of transactions" | wording only: `span` items, no `transaction` item |
| index.mdx:203, 214-223, Issues verify button | yes |
| index.mdx:254-267, Tracing verify button (`onClick`) | **no**, the button is dead on Svelte 5 |
| index.mdx:247, the span measures "the time it takes for the execution of your code" | no, 0 ms, the throw happens outside it |
| index.mdx:104, `tracePropagationTargets: ["localhost", ...]` | yes, headers on both fetches |
| index.mdx:112-113, replay on error | yes, after `minReplayDuration` |
| logs include :6 | yes, and without `enableLogs` |
| component-tracking.mdx:16-29, `withSentryConfig` injects the preprocessor | yes (via `esbuild-svelte`) |
| component-tracking.mdx:33, all components tracked by default | yes, init spans only |
| component-tracking.mdx:51, `trackComponents` array | yes |
| component-tracking.mdx:54-57, 87-89, `trackUpdates` "defaults to `true`" | **no**, default is `false` |
| component-tracking.mdx:68, 72, `ui.svelte.init` / `ui.svelte.update` | **no**, `ui.mount` / `ui.update` |
| component-tracking.mdx:72-74, update spans | legacy-mode components only, runes mode warns |
| component-tracking.mdx:80-95, `trackComponent` by hand | yes |

## Findings

1. **P0, docs wrong**, `index.mdx:257`: the Svelte v5+ tab of the Tracing verify snippet uses
   `onClick={...}`. Svelte 5 compiles that to `event("Click", ...)`, the button gets no click
   handler, and clicking it sends nothing, with no compiler or dev-mode warning; the Issues snippet
   two sections up (index.mdx:217) correctly uses `onclick`, and the same snippet with `onclick` sends
   the span and the error. Fix: `onClick` -> `onclick` in the Svelte v5+ tab.
2. **P1, docs wrong**, `features/component-tracking.mdx:68, 72`: the ops are `ui.mount` and
   `ui.update` (span names `<Navbar>`, `<MyAwesomeComponent>`, origin `auto.ui.svelte`), not
   `ui.svelte.init` and `ui.svelte.update`. Fix: rename the ops and add the `<ComponentName>` span name.
3. **P1, docs wrong**, `features/component-tracking.mdx:55-57` and `:87-89`: "`trackUpdates` ...
   (defaults to `true`)"; the build defaults to `false` in both `withSentryConfig` and
   `trackComponent`, so `withSentryConfig(config)` never produces update spans. Fix: say it defaults
   to `false` and must be switched on.
4. **P1, SDK limit**, `features/component-tracking.mdx:72-74`: with Svelte 5 runes mode
   (`$state`/`$props`, what a new Svelte 5 user writes) `trackUpdates: true` cannot record update
   spans; `beforeUpdate`/`afterUpdate` throw, the SDK swallows it and warns only under `debug: true`.
   Update spans arrive for legacy-mode components only. Fix: say on the page that update spans need
   legacy-mode components on Svelte 5 and that runes-mode components are skipped with a warning.
5. **P2, docs wrong**, `index.mdx:247`: "start a performance trace to measure the time it takes for
   the execution of your code"; the snippet's callback returns synchronously after scheduling
   `setTimeout`, so the span is 0 ms and the error is thrown outside it. Fix: use an async callback
   that awaits the timer (as the Vue guide does) or drop the "measure" claim.
6. **P2, docs wrong**, `index.mdx:96-97`, `features/component-tracking.mdx:6, 66`: "transactions" and
   "the ongoing transaction", while develop sends `span` envelope items (a `pageload` segment named
   `Pageload` with `url.path`) and no `transaction` item. Fix: say "root spans / traces".
7. **P2, SDK limit**, `index.mdx:69-122`: the guide's config has no `release`, and the SDK logs
   `Discarded session because of missing or non-string release` and sends no `session` item, so
   Release Health stays empty for a user who follows the guide; the page does not say so. Fix: mention
   that sessions need `release` (the source-maps wizard step sets it).
8. **P2, docs wrong**, `features/component-tracking.mdx:23, 40`: `compilerOptions: {...}` is a
   syntax error when copied (`SyntaxError: Unexpected token '}'`); the other guides use `// ...`
   for placeholders. Fix: replace with `// ...`.

Notes, not findings: logs arrive without `enableLogs` on develop; the Logs verify block
(index.mdx:289-293) is gated on `optionId="logs"`, which the option buttons (index.mdx:49-56) do
not offer, the same as in the Vue and React guides. The harness assigns `window.Sentry = Sentry`,
which keeps every export in the bundle (including `withSentryConfig`'s preprocessor and
`magic-string`), so the 1.1 MB unminified bundle size is not representative of a user build.

## Files

- `package.json`: tarball pins and `overrides`, `svelte` 5.57.0, `esbuild` 0.25.9, `esbuild-svelte` 0.9.5, `playwright-core` 1.55.0.
- `svelte.config.js`, `svelte.config.options.js`: component-tracking.mdx:18-27 and :35-61.
- `build.mjs`: esbuild + esbuild-svelte, imports the variant's svelte config, writes `dist/<variant>.build.json`.
- `run.sh`, `sink.mjs`, `drive.mjs`: harness (port 4720, sentinel pattern, 60 s deadline).
- `src/base/`: index.mdx:69-122 `main.js`, `App.svelte`, `SomeComponent.svelte` with the verify buttons.
- `src/component-tracking/`: `main.js`, `App.svelte`, `Navbar.svelte` (no script), `PrimaryButton.svelte` (runes), `LoginForm.svelte` (legacy).
- `src/track-component/`: `MyComponent.svelte` (component-tracking.mdx:80-95), `RunesCounter.svelte`, `LegacyCounter.svelte`.
- `results-base.json`, `results-base-dev.json`, `results-component-tracking.json`, `results-component-tracking-options.json`, `results-track-component.json`, with `app-*.log` and `sink-*.log`.
