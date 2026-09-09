# QS-vue, the Vue getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/vue`
pulls `@sentry/browser`, `@sentry/core` and `@sentry/conventions@^0.20.0` and declares peers
`vue: 2.x || 3.x`, `pinia: 2.x || 3.x || 4.x` (optional) and `@tanstack/vue-router` (optional).

Google Chrome 152.0.7977.83 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `esbuild` 0.25.9 (production bundles), node v26.5.0,
macOS 15.7.7 (Darwin 24.6.0). `vue` 3.5.42, `vue-router` 4.6.4, `pinia` 3.0.4 from the registry.
All envelopes go to a local sink on `localhost:4714` via the `tunnel` option; nothing leaves the machine.

No SFC compiler: every component is a plain object with a `template` string, so `build.mjs` aliases
`vue` to the full build `vue/dist/vue.esm-bundler.js` (runtime + compiler) and defines the three
`__VUE_*` flags the way Vite does. `FULL_BUILD=0` drops the alias to show what the default
runtime-only `vue` export does with a `template` option (see `late-init-runtime`).

## What it reproduces

A new user following `docs/platforms/javascript/guides/vue/index.mdx` end to end, then the feature
pages under `guides/vue/features/`. There is no `config.yml` in `guides/vue/`; the page's frontmatter
carries `sdk: sentry.javascript.vue` and `categories: [javascript, browser]` (index.mdx:4-7).

Where each rendered include really comes from (`javascript.vue.mdx`, else `javascript.mdx`, else
`_default.mdx`; no `javascript.vue.mdx` exists for any include the guide references):

| Reference in the guide | Renders from |
| --- | --- |
| `<PlatformContent includePath="getting-started-prerequisites" />` (index.mdx:10) | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` |
| `<Include name="quick-start-features-expandable" />` (index.mdx:54) | `includes/quick-start-features-expandable.mdx:20-27`, the section listing `javascript.vue`: issues, tracing, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-sourcemaps-short-version" />` (index.mdx:253) | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx:1-19` (wizard only, not run) |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:257) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22`, snippet at 14-17 |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:261) | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:280) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="logs/javascript-quick-start-verify-logs-splitlayout" />` (index.mdx:347) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:1-28`, snippet at 12-24 |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:355) | `includes/quick-start-locate-data-expandable.mdx:20-27` |

The guide's own snippets that were copied verbatim: install (index.mdx:26), `main.js` for Vue 3
(index.mdx:71-126, all four product options, with the `// ...` of `createApp` and `createRouter`
filled by `src/shared/routes.js`), late-defined apps (index.mdx:203-219), Pinia (index.mdx:238-245),
tunneling (tunneling include :14-17), the verify button (index.mdx:285-298), the tracing verify
button (index.mdx:318-337) and the logs lines (logs include :12-24). The Vue 2 tab (index.mdx:128-185)
was not run: it is a separate tab for Vue 2 projects, and Vue 3 is what the guide installs.

Feature pages: `features/vue-router.mdx` (13-43 verbatim as a build probe, 49-54 run),
`features/component-tracking.mdx` (28-48 verbatim, 56-69 verbatim as a build probe and with its
missing comma fixed), `features/pinia.mdx` (8-15, the same snippet as the guide's Pinia step),
`features/multiple-apps.mdx` (13-21 and 27-33). `features/index.mdx` is a `<PageGrid />` only.

Every routed variant page carries the guide's verify buttons (`src/shared/VerifyButtons.js`):
`#btn-throw` (index.mdx:285-298), `#btn-span` (index.mdx:318-337), `#btn-log` (logs include :12-24)
and `#btn-fetch`, a probe that fetches `/recorder?from=relative` and `<origin>/recorder?from=absolute`
so the sink can record whether `sentry-trace` / `baggage` reached it under the guide's
`tracePropagationTargets: ["localhost", ...]`. The run ends with `window.__qsSentinel('sentinel')`,
`captureMessage` plus a `sentinel-span`, and polls the sink for both (message only when the variant
has no tracing); nothing sleeps.

## Install

```bash
cd $REPRO/quickstarts/vue
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
              # and repeats them in `overrides`
```

`added 49 packages, and audited 50 packages in 12s`, no peer complaints. Installed tree
(`node_modules/@sentry`): `browser browser-utils conventions core feedback replay replay-canvas vue`;
all SDK packages `10.67.0` with `resolved: file:../../_toolbox/pack-develop-03aaf424/…` in
`package-lock.json`, plus `@sentry/conventions@0.20.0` from the registry. `vue`, `vue-router`,
`pinia`, `esbuild` and `playwright-core` come from the registry.

Every export the docs snippets use exists in `node_modules/@sentry/vue/build/types/index.d.ts`:
`init`, `browserTracingIntegration`, `attachErrorHandler`, `createTracingMixins`, `vueIntegration`,
`createSentryPiniaPlugin`, and `replayIntegration`, `feedbackIntegration`, `addIntegration`,
`startSpan`, `captureException`, `logger` via `export * from '@sentry/browser'`. **None is missing
and nothing in `build/types/*.d.ts` is marked `@deprecated`.** The build also ships
`build/esm/tanstackrouter.js`, which `index.js` does not export; no Vue docs page mentions TanStack.

## Run

```bash
cd $REPRO/quickstarts/vue
./run.sh base                            # index.mdx main.js (Vue 3 tab, all options) + verify snippets, opened at /users/42
./run.sh vue-router-path                 # vue-router.mdx:49-54, browserTracingIntegration({ router, routeLabel: "path" })
./run.sh vue-router-verbatim             # vue-router.mdx:13-43 verbatim, build only
./run.sh component-tracking              # component-tracking.mdx:28-48 verbatim (two trackComponents keys)
./run.sh component-tracking-hooks        # component-tracking.mdx:56-69 verbatim, build only
./run.sh component-tracking-hooks-fixed  # the same with the comma added, hooks: ["mount", "update", "unmount"]
./run.sh pinia                           # index.mdx:238-245 / pinia.mdx:8-15, createSentryPiniaPlugin()
./run.sh multiple-apps                   # multiple-apps.mdx:13-21 and 27-33
./run.sh late-init                       # index.mdx:203-219, addIntegration(vueIntegration({ app }))
MODE=development ./run.sh base           # the same bundle in development mode (Vite dev server), results-base-dev.json
FULL_BUILD=0 ./run.sh late-init          # runtime-only `vue` export, results-late-init-runtime.json
```

Each run builds `dist/<variant>.js`, starts the sink and static server on `localhost:4714` (with an
SPA fallback to `public/<variant>.html` for extension-less paths), drives one headless Chrome
through the buttons, triggers the sentinel and polls `/__items` for it, waits for the pageload
segment span, runs the variant-specific steps (router links, prop updates, store actions, per-app
throws), and writes `results-<variant>.json` (`meta` from `Sentry.getClient()`, `steps`, `summary`,
`console`, `pageErrors`, the compact sink items, the recorder headers and the raw envelope
payloads). The browser console is also in `app-<variant>.log`. A variant that does not build writes
`results-<variant>.json` with esbuild's messages under `build.errors` instead.

## Expected

**Install and configure**

- index.mdx:26, `npm install @sentry/vue --save`.
- index.mdx:60 and 71-126, `main.js`: `Sentry.init({ app, dsn, integrations: [browserTracingIntegration({ router }),
  replayIntegration(), feedbackIntegration({ colorScheme: "system" })], tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/], replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0 })`, then `app.use(router); app.mount("#app")`. No `release`.
- index.mdx:103-104, "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing."
- index.mdx:197-219, late-defined apps: filter the default `Vue` integration, later
  `Sentry.addIntegration(Sentry.vueIntegration({ app }))` on a `createApp({ template: "<div>hello</div>" })`.
- index.mdx:231-245, Pinia: `pinia.use(createSentryPiniaPlugin())` "to capture Pinia state data".
- tunneling include :14-17, `tunnel: "/tunnel"`.
- data-collection include :8, "The SDK always filters sensitive values whose keys match a built-in
  denylist, such as `auth` or `password`, and sends `[Filtered]` instead."

**Verify**

- index.mdx:273 and 285-298, a `<button @click="throwError">` whose method throws `new Error('Sentry Error')`.
- index.mdx:311-337, tracing: `Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, async () => {
  await new Promise(resolve => setTimeout(resolve, 99)); throw new Error("Sentry Error"); })`,
  "click the button to trigger a frontend error and performance trace".
- logs include :12-24, `Sentry.logger.info/warn/error` with attributes.

**Feature pages**

- vue-router.mdx:6-8, "better parameterized transaction names", `vue-router` v2, v3 and v4; :13-43 the
  only full example (`import Vue from "vue"`, `import Router from "vue-router"`, `Vue.use(Router)`,
  `new Router(...)`, `new Vue({ el: "#app", ... })`); :49-60 `routeLabel: "path"` and the default
  `name` ("the transaction will use `route.name`, if it is set, and else use the path of the route").
- component-tracking.mdx:7, "spans in your transactions"; :19 the root render is "represented in the
  page load transaction by the **`ui.vue.render`** span"; :23 child spans are called `ui.vue.[hook]`,
  for example `ui.vue.mount`; :28-48 `vueIntegration({ tracingOptions: { trackComponents } })`;
  :50 default `trackComponents` is `false`; :56-69 `hooks`; :71 "The default set of tracked hooks is
  `['activate', 'mount', 'update']`"; :103 default timeout 2000 ms.
- pinia.mdx:34, "While we try our best to filter out Personally Identifiable Information (PII) such
  as user passwords, we advise against sending sensitive information to Sentry"; :41 `attachPiniaState`
  attaches Pinia state to events; :51 breadcrumbs.
- multiple-apps.mdx:11-21, `app: [appOne, appTwo, appThree]` written as `Vue.createApp(App)`; :25-33
  `myLazyApp.mixin(Sentry.createTracingMixins({ trackComponents: true })); Sentry.attachErrorHandler(myLazyApp);`.

**What v10-to-v11 changes about the above** (`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx`)

- :192, "Transactions no longer exist: what used to be one transaction event is a service span with
  its child spans." Verify must produce `span` envelopes, not `transaction` envelopes.
- :350/:356, `pageload` and `navigation` names fall back to `Pageload` and `Navigation`.
- :454, "React, Vue, and Svelte component lifecycles: `ui.react.mount`/`render`/`update` ... →
  `ui.mount`, `ui.render`, `ui.update`".

## Observed on 2026-09-08

### Step 1, install

`npm install` of the seven develop tarballs plus Vue, Vue Router, Pinia and the tooling succeeded
with no peer or version complaints. One `npm install @sentry/vue` is all a reader needs. **Holds.**

### Step 2, configure (`results-base.json`)

`main.js` (index.mdx:71-126) initializes without a warning. `Sentry.getClient()` reports:

```json
{"SDK_VERSION":"10.67.0",
 "sdk":{"name":"sentry.javascript.vue","version":"10.67.0","packages":[{"name":"npm:@sentry/vue","version":"10.67.0"}]},
 "integrations":["EventFilters","FunctionToString","ConversationId","BrowserApiErrors","Breadcrumbs","GlobalHandlers",
                 "LinkedErrors","Dedupe","HttpContext","CultureContext","BrowserSession","Vue","BrowserTracing","Replay",
                 "Feedback","SpanStreaming","WebVitals"],
 "options":{"tracesSampleRate":1,"tracePropagationTargets":["localhost","/^https:\\/\\/yourserver\\.io\\/api/"],
            "replaysSessionSampleRate":0.1,"replaysOnErrorSampleRate":1,"tunnel":"/tunnel",
            "traceLifecycle":"stream","attachStacktrace":true,"debug":true},
 "vue":"3.5.42"}
```

17 integrations (`Vue` included; the router-only and Pinia variants get 15 and 12). `traceLifecycle`
resolves to `"stream"` without being set. `#sentry-feedback` is in the DOM. Envelope headers carry
`{"name":"sentry.javascript.vue","version":"10.67.0"}`. **Holds.**

**No session envelope is ever sent, in any run.** The guide's snippet has no `release`, and the console
shows, twice per run: `Sentry Logger [warn]: Discarded session because of missing or non-string release`.
The `BrowserSession` integration is installed but Release Health gets nothing.

### Step 3, verify (`results-base.json`)

`#btn-throw` (index.mdx:285-298), a method that throws, production bundle:

```json
{"type":"event","exception":"Error: Sentry Error","mechanism":"auto.function.vue.error_handler","handled":false,
 "contexts":["trace","vue","culture"],
 "vue":{"componentName":"<VerifyButtons>","lifecycleHook":"https://vuejs.org/error-reference/#runtime-5","trace":"\n\n(found in <VerifyButtons>)","propsData":{}},
 "transaction":"user","topFrame":{"function":"Proxy.throwError","filename":"http://localhost:4714/base.js","in_app":true},
 "tags":{"replayId":"166b7308…"}}
```

Vue's `app.config.errorHandler` (installed by the `Vue` integration) captures it with the component
context, then re-throws; Vue's `logError` prints it with `console.error` in production. **Holds.**

The same click in development mode (`results-base-dev.json`, `MODE=development`, what a Vite dev
server serves):

```json
{"type":"event","exception":"Error: Sentry Error","mechanism":"auto.browser.browserapierrors.addEventListener","handled":false,"contexts":["trace","culture"]}
console: [Vue warn]: Unhandled error during execution of app errorHandler
console: Sentry Logger [log]: Not capturing exception because it's already been captured.
```

In dev builds Vue re-throws out of the click listener, `BrowserApiErrors` captures the error
synchronously, and the Vue handler's own capture (scheduled in a `setTimeout`, the one with
`contexts.vue`, `componentName`, `propsData`) is dropped as a duplicate. The reader following the
guide in `vite dev` sees an event without any Vue context and a Vue warning that blames the error
handler. **Partial**, depends on the build mode.

`#btn-span` (index.mdx:318-337), the async span:

```json
{"op":"test","name":"Example Frontend Span","status":"error","duration_ms":100,"is_segment":false,"origin":"manual"}
{"type":"event","exception":"Error: Sentry Error","mechanism":"auto.browser.global_handlers.onunhandledrejection","handled":false,"contexts":["trace","culture"]}
```

The span lasts the 99 ms, ends with `status: error`, and the rejected promise reaches
`GlobalHandlers` as an unhandled rejection in the same trace. The error and the span belong
together, unlike the React guide's `setTimeout` version. **Holds.**

Spans, one `span` envelope per segment and no `transaction` envelope anywhere:

```json
{"op":"pageload","name":"user","status":"error","is_segment":true,"source":"custom","origin":"auto.pageload.vue","url_path":"/users/42","duration_ms":372,
 "attributes":{"url.path.parameter.id":"42","params.id":"42","navigation.route.id":"user","sentry.idle_span_finish_reason":"idleTimeout"}}
{"op":"ui.mount","name":"Vue <Root>","origin":"auto.ui.vue","duration_ms":3}
{"op":"ui.render","name":"Application Render","origin":"auto.ui.vue","duration_ms":3}
{"op":"navigation","name":"home","is_segment":true,"source":"custom","origin":"auto.navigation.vue","url_path":"/"}
{"op":"navigation","name":"/plain/:id","is_segment":true,"source":"route","origin":"auto.navigation.vue","url_path":"/plain/5","attributes":{"url.template":"/plain/:id"}}
{"op":"navigation","name":"user","is_segment":true,"source":"custom","origin":"auto.navigation.vue","url_path":"/users/7"}
```

With the default `routeLabel: "name"` a named route gives the segment the route *name* (`user`,
`home`) with `source: custom`; an unnamed route gives the parameterized path with `source: route`
and `url.template`. Error events carry `transaction: "user"` and the baggage carries
`sentry-transaction=user`. The guide's "transactions" (index.mdx:103-104) and the router page's
"parameterized transaction names" are `span` items here. **Holds**, with that wording gap.

`#btn-fetch`, `tracePropagationTargets: ["localhost", …]` (index.mdx:111): both the relative and the
absolute same-origin fetch got `sentry-trace` and `baggage` (`http.client GET localhost` x2). **Holds.**

`#btn-log` (logs include :12-24): one `log` envelope, `info: User example action completed`,
`warn: Slow operation detected`, `error: Validation failed`, with the attributes. **Holds.** As in
the React guide, index.mdx:45-52 offers no `logs` onboarding option while :345-349 is gated on it.

Replay: `[Replay] Session duration (0s) is too short, not sending replay.` for the buffer converted
by the first click; the `replay_event` only arrived after one more error past `minReplayDuration`.
**Partial**, as in the browser and React runs.

### Step 4, Vue Router (`results-vue-router-path.json`, `results-vue-router-verbatim.json`)

`routeLabel: "path"` (vue-router.mdx:49-54) on the guide's `main.js`, opened at `/users/42`:

```json
{"op":"pageload","name":"/users/:id","is_segment":true,"source":"route","origin":"auto.pageload.vue","url_path":"/users/42","status":"error"}
{"op":"navigation","name":"/","source":"route","url_path":"/"}
{"op":"navigation","name":"/plain/:id","source":"route","url_path":"/plain/5"}
{"op":"navigation","name":"/users/:id","source":"route","url_path":"/users/7"}
```

Parameterized names with `source: route` on every segment, error events with
`transaction: "/users/:id"`. **Holds.**

vue-router.mdx:13-43 verbatim (the page's only full example) against the Vue 3 install:

```
✘ [ERROR] No matching export in "node_modules/vue/dist/vue.esm-bundler.js" for import "default"      import Vue from "vue";
✘ [ERROR] No matching export in "node_modules/vue-router/dist/vue-router.mjs" for import "default"   import Router from "vue-router";
```

(after resolving the snippet's `@/components/...` imports, which esbuild also cannot resolve without
a Vue CLI style alias.) `vue@3` and `vue-router@4` have no default export, and `Vue.use(Router)`,
`new Router(...)` and `new Vue({ el: ... })` are Vue 2 / vue-router 3 APIs. The page has no Vue 3
example although it says vue-router v4 is supported (:8). **Does not build.**

### Step 5, component tracking (`results-component-tracking.json`, `results-component-tracking-hooks.json`, `results-component-tracking-hooks-fixed.json`)

component-tracking.mdx:28-48 verbatim, with `browserTracingIntegration()`, `tracesSampleRate` and
`app` added (the page says tracing must be configured, :13):

```
esbuild: ▲ [WARNING] Duplicate key "trackComponents" in object literal
{"op":"ui.mount","name":"Vue <RwvHeader>","origin":"auto.ui.vue"}
{"op":"ui.mount","name":"Vue <Pagination>","origin":"auto.ui.vue"}
{"op":"ui.mount","name":"Vue <Root>","origin":"auto.ui.vue"}
{"op":"ui.render","name":"Application Render","origin":"auto.ui.vue"}
{"op":"pageload","name":"Pageload","is_segment":true,"source":"url"}
```

The snippet's second `trackComponents` key wins, so only the listed names are tracked
(`<Untracked>` gets no span) and, after two prop changes and an unmount, there is **no `ui.update`
and no `ui.unmount` span**: the build's `DEFAULT_HOOKS` is `["activate", "mount"]`
(`build/esm/constants.js`), not the `['activate', 'mount', 'update']` the page states at :71. The ops
are `ui.mount` / `ui.render` / `ui.update` / `ui.unmount` (`build/esm/tracing.js` imports
`UI_MOUNT`, `UI_UPDATE`, `UI_UNMOUNT`, `UI_RENDER` from `@sentry/conventions/op`), and the span names
are `Vue <Name>` and `Application Render`, not the `ui.vue.render` / `ui.vue.[hook]` of :19-23.
**Partial.**

component-tracking.mdx:56-69 verbatim: `✘ [ERROR] Expected "}" but found "hooks"` at
`hooks: ["mount", "update", "unmount"]`, the line before lacks its comma. **Does not build.** With
the comma added (`component-tracking-hooks-fixed`, `trackComponents: true`):

```
ui.mount Vue <RwvHeader> | ui.mount Vue <Pagination> | ui.mount Vue <Untracked> | ui.mount Vue <Root>
ui.update Vue <Pagination> x2 | ui.update Vue <Root> x3 | ui.unmount Vue <RwvHeader> | ui.render Application Render
```

All under the `Pageload` segment. `hooks` is additive: `createTracingMixins` always concatenates
`DEFAULT_HOOKS`, so `mount` cannot be switched off. **Holds once the comma is added.**

### Step 6, Pinia (`results-pinia.json`)

index.mdx:238-245 (= pinia.mdx:8-15) verbatim, a `counter` store, `increment` x2,
`setPassword("hunter2")`, `governmentSecrets("area51")`, then `captureException(new Error("Error with pinia state"))`:

```json
{"type":"event","contexts":["trace","state","culture"],
 "state":{"type":"pinia","value":{"counter":{"count":2,"password":"hunter2","secret":"area51"}}},
 "breadcrumbs":["pinia.action: Store: counter | Action: increment","… increment","… setPassword","… governmentSecrets"]}
{"type":"attachment","filename":"pinia_state_all_stores_23:41:48.json","length":62,"payload":{"counter":{"count":2,"password":"hunter2","secret":"area51"}}}
```

State context, action breadcrumbs and the attachment all arrive on every event (the sentinel
message got the attachment too). **Holds.** But `password: "hunter2"` is sent in clear in the state
context and in the attachment, while pinia.mdx:34 says "we try our best to filter out Personally
Identifiable Information (PII) such as user passwords" and the guide's data-collection include (:8)
promises `[Filtered]` for keys like `password`. The attachment filename contains colons (`23:41:48`).

### Step 7, multiple apps (`results-multiple-apps.json`)

multiple-apps.mdx:13-21 as printed (`Vue.createApp(App)`, with `import * as Vue from "vue"` since the
page shows no import) plus :27-33 for a fourth app mounted afterwards:

```json
{"exception":"Error: Error from app one",  "mechanism":"auto.function.vue.error_handler","handled":false,"vue":{"componentName":"<Root>","propsData":{"label":"one"}}}
{"exception":"Error: Error from app two",  "…":"…","vue":{"propsData":{"label":"two"}}}
{"exception":"Error: Error from app three","…":"…","vue":{"propsData":{"label":"three"}}}
{"exception":"Error: Error from app lazy", "mechanism":"auto.function.vue.error_handler","handled":false,"vue":{"componentName":"<Root>","propsData":{"label":"lazy"}}}
spans: ui.mount Vue <Root> x4, ui.mount Vue <LazyChild> (the lazy app's trackComponents: true), ui.render Application Render x4
```

All four apps report with component context; the lazy app's `createTracingMixins` tracks its child.
**Holds.** (`import Vue from "vue"` would fail as in step 4; the page shows no import line.)

### Step 8, late-defined app (`results-late-init.json`, `results-late-init-runtime.json`)

index.mdx:203-219 verbatim (plus `import { createApp }`, which the snippet omits, and a throw
button in the template): before `addIntegration` the client has 11 integrations, afterwards 12 with
`Vue`; the click produced `{"exception":"Error: late-init error","mechanism":"auto.function.vue.error_handler","handled":false,"vue":{"componentName":"<Root>"}}`.
**Holds.**

The same bundle without the full-build alias (`FULL_BUILD=0`, the default `vue` export of a bundler
project): the app renders `<!---->`, nothing else, and the production build prints no warning
(`appHtml: "<!---->"`, no console line). The snippet's `template: "<div>hello</div>"` needs the
runtime + compiler build (`vue/dist/vue.esm-bundler.js`), which no bundler picks by default.
**Renders nothing as printed.**

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/vue --save` is all you need (index.mdx:26) | **yes** |
| The Vue 3 `main.js` snippet initializes the SDK (index.mdx:71-126) | **yes**, 17 integrations, `traceLifecycle: "stream"`, feedback widget in the DOM |
| `tracePropagationTargets: ["localhost", …]` propagates the trace (index.mdx:111) | **yes**, relative and absolute same-origin fetches both got `sentry-trace` and `baggage` |
| The verify button creates an issue (index.mdx:273, 285-298) | **yes** in production builds, `auto.function.vue.error_handler` with `contexts.vue`; in dev builds the event has no Vue context and Vue warns about the error handler |
| The tracing verify button gives "a frontend error and performance trace" (index.mdx:311-337) | **yes**, a 100 ms `test` span with `status: error` and an `onunhandledrejection` event in the same trace |
| "capture 100% of transactions" (index.mdx:103-104), "transaction names" (vue-router.mdx:6, 60) | **partial**, everything is a `span` item, `pageload` / `navigation` segments; no `transaction` envelope |
| `Sentry.logger.*` reaches Sentry (logs include :12-24) | **yes** |
| `tunnel` forwards events (tunneling include :14-17) | **yes**, every envelope of every run came through `/tunnel` |
| Session Replay of the first error | **partial**, "Session duration (0s) is too short", later errors ship a replay |
| Default `routeLabel` uses `route.name`, else the path (vue-router.mdx:60) | **yes**, `user` / `home` with `source: custom`, `/plain/:id` with `source: route` |
| `routeLabel: "path"` gives parameterized names (vue-router.mdx:49-54) | **yes**, `/users/:id`, `source: route` |
| vue-router.mdx:13-43 full example runs | **no**, `import Vue from "vue"` and `import Router from "vue-router"` have no default export on Vue 3 / vue-router 4 |
| Root render is `ui.vue.render`, children `ui.vue.[hook]` (component-tracking.mdx:19-23) | **no**, `ui.render` "Application Render", `ui.mount` "Vue <Name>", plus a `ui.mount` "Vue <Root>" |
| Default tracked hooks are `['activate', 'mount', 'update']` (component-tracking.mdx:71) | **no**, `["activate", "mount"]`; no update spans without `hooks` |
| component-tracking.mdx:28-48 runs as printed | **partial**, it builds with a duplicate-key warning and the array (not `true`) is what applies |
| component-tracking.mdx:56-69 runs as printed | **no**, syntax error (missing comma) |
| `hooks: ["mount", "update", "unmount"]` tracks updates and unmounts | **yes**, with the comma |
| Pinia plugin attaches state, breadcrumbs and an attachment (index.mdx:231, pinia.mdx:41, 51) | **yes** |
| "we try our best to filter out PII such as user passwords" (pinia.mdx:34), `[Filtered]` for `password` (data-collection include :8) | **no**, `password: "hunter2"` arrives in clear in the state context and the attachment |
| `app: [appOne, appTwo, appThree]` and `createTracingMixins` + `attachErrorHandler` (multiple-apps.mdx) | **yes** |
| Late-defined app via `addIntegration(vueIntegration({ app }))` (index.mdx:203-219) | **yes** with the full Vue build; `template: "<div>hello</div>"` renders nothing on the default runtime-only export |
| Release Health sessions | **no**, no `release` in the snippet, "Discarded session because of missing or non-string release" |

## Findings

1. **P0, docs wrong**, `features/vue-router.mdx:13-43`: the page's only full example is Vue 2 code
   (`import Vue from "vue"`, `import Router from "vue-router"`, `Vue.use`, `new Router`, `new Vue`);
   on the Vue 3 / vue-router 4 install the guide produces, esbuild fails with `No matching export
   … for import "default"` for both imports. Fix: add the Vue 3 form (`createApp`, `createRouter`,
   `Sentry.init({ app, integrations: [Sentry.browserTracingIntegration({ router })] })`) as the
   primary tab, as index.mdx:71-126 already does.
2. **P0, docs wrong**, `features/component-tracking.mdx:56-69`: `trackComponents: true` (:63) has no
   trailing comma before `hooks:`, a syntax error (`Expected "}" but found "hooks"`). Fix: add the comma.
3. **P1, docs wrong**, `features/component-tracking.mdx:71`: "The default set of tracked hooks is
   `['activate', 'mount', 'update']`"; the build's default is `["activate", "mount"]`, so a reader
   who enables `trackComponents` and expects update spans gets none until they pass `hooks`. Fix:
   state the default as `['activate', 'mount']` and say `hooks` adds to it (mount cannot be turned off).
4. **P1, docs wrong**, `features/component-tracking.mdx:19-23`: the ops are `ui.render`
   ("Application Render"), `ui.mount` / `ui.update` / `ui.unmount` ("Vue <Name>"), not `ui.vue.render`
   and `ui.vue.[hook]`; the migration page (:454) documents the rename, the feature page does not.
   Fix: rename the ops and add the span names.
5. **P1, docs wrong**, `features/pinia.mdx:34` and the guide's data-collection include
   (`getting-started-data-collection/javascript.mdx:8`): `password: "hunter2"` is sent in clear in
   `contexts.state` and in `pinia_state_all_stores_*.json`; the built-in denylist is not applied to
   Pinia state. Fix: drop the "we try our best to filter out … passwords" sentence and point at
   `stateTransformer`, and scope the `[Filtered]` promise to the data the `dataCollection` categories cover.
6. **P2, docs wrong**, `features/component-tracking.mdx:28-48`: the snippet has `trackComponents`
   twice (`true`, then the array), so as printed the array applies and esbuild warns about the
   duplicate key. Fix: split it into two snippets or comment one form out.
7. **P2, docs wrong**, `index.mdx:103-104`, `features/vue-router.mdx:6, 60`, `features/component-tracking.mdx:7, 19`:
   "transactions" everywhere, while develop sends `span` envelope items (`pageload` / `navigation`
   segments named after the route) and no `transaction` envelope. Fix: say "root spans / traces".
8. **P2, docs wrong**, `index.mdx:203-219`: the late-init snippet uses `createApp` without importing
   it and a `template: "<div>hello</div>"` option, which renders nothing (`<!---->`, no warning in
   production) on the default runtime-only `vue` export of a bundler project. Fix: import
   `createApp` and use a render function or note the `vue/dist/vue.esm-bundler.js` alias.
9. **P2, SDK limit**, `index.mdx:273-298`: in development builds (`vite dev`) the verify error is
   captured by `BrowserApiErrors` without `contexts.vue`, the Vue error handler's capture is dropped
   as a duplicate, and Vue prints `Unhandled error during execution of app errorHandler`. Fix: a note
   that the component context shows up in production builds, or that the dev-mode warning is expected.
10. **P2, SDK limit**, `index.mdx:71-126`: no `release` in the snippet, so every session is
    discarded ("Discarded session because of missing or non-string release") and Release Health
    stays empty. Fix: add `release` to the snippet or a one-line note.
11. **P2, docs wrong**, `features/multiple-apps.mdx:13-21`: `Vue.createApp(App)` needs
    `import * as Vue from "vue"` (a default import fails on Vue 3), and the snippet shows no import,
    `dsn` or `App`. Fix: show the imports, or use `createApp` like the guide.

Not a finding, a note: `features/vue-router.mdx:8` says v2, v3 and v4 routers are supported; only
vue-router 4 was run. The default `routeLabel: "name"` makes named routes `source: custom` segments
(`user`, `home`), which is what vue-router.mdx:60 describes.

## Files

`package.json`, `build.mjs` (esbuild, one bundle per `src/<variant>/main.js`, `vue` aliased to the
full build, an `@/` resolver for the verbatim router snippet), `src/shared/` (`harness.js`, the
driver hooks; `VerifyButtons.js`, the guide's verify snippets; `routes.js`, the routes and root
component; `tracked.js`, the components for component tracking), one directory per variant under
`src/`, `public/<variant>.html`, `drive.mjs` (the Playwright driver), `run.sh`, and `sink.mjs`, a
copy of `../react/sink.mjs` with `contexts.vue` and Pinia breadcrumbs in the compact mapping and
port 4714. `results-<variant>.json`, `app-<variant>.log` and `sink-<variant>.log` are the runs;
`results-vue-router-verbatim.json` and `results-component-tracking-hooks.json` hold esbuild's errors.

`node_modules/` and `dist/` are left in place from the run; the Install and Run sections recreate
them from scratch if they are removed.
