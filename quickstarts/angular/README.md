# QS-angular, the Angular getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`).
`@sentry/browser`, `@sentry/browser-utils`, `@sentry/core`, `@sentry/feedback`, `@sentry/replay` and
`@sentry/replay-canvas` come from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`.
**`@sentry/angular` does not**: the toolbox's `sentry-angular-10.67.0.tgz` (19.8 kB) was packed from
the package root instead of its `build/` directory and holds 21 files (`src/*.ts`, `test/*.ts`,
`ng-package.json`, `angular.json`, ...), no `fesm2015/`, no `index.d.ts`, so nothing can import it.
`vendor/sentry-angular-10.67.0.tgz` is a copy of the SDK repo's `packages/angular/sentry-angular-10.67.0.tgz`
(an `npm pack ./build` output of 2026-09-07, `module: fesm2015/sentry-angular.mjs`, `typings: index.d.ts`);
its six `src/*.ts` sources are byte-identical to the ones inside the toolbox tarball, and the last
commit that touched `packages/angular/src` (`78bcb9b0d0`, 2026-08-31) predates `03aaf42455`, so the
built code is the same. `@sentry/angular` pulls `@sentry/browser@10.67.0`, `@sentry/core@10.67.0`,
`@sentry/conventions@^0.20.0` and `tslib`, and declares peers `@angular/{common,core,router} >= 14.x <= 22.x`,
`rxjs ^6.5.5 || ^7.x`.

Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), node v26.5.0, macOS 15.7.7 (Darwin 24.6.0). Angular
22.1.5 (`@angular/core`, `common`, `compiler`, `platform-browser`, `platform-browser-dynamic`, `router`),
`@angular/cli` 22.1.7 with the `@angular/build:application` builder (esbuild), `@angular/compiler-cli`
22.1.5, TypeScript 6.0.3, `rxjs` 7.8.2, `zone.js` 0.16.0 from the registry. Production builds
(`ng build --configuration production,<variant>`, 1.4 to 2.8 s each). All envelopes go to a local sink
on `localhost:4715` via the `tunnel` option; nothing leaves the machine.

One hand-written `ng new`-shaped workspace (no SSR, tests or animations): `angular.json` has one
project whose configurations override the entry (`browser`), the tsconfig and the output path, so
every variant is `src/variants/<name>/main.ts` built into `dist/<name>/`. `tsconfig.json` is the
strict workspace tsconfig the CLI 22.1.7 schematic generates (`experimentalDecorators: true`,
`noImplicitOverride: true`, `strictTemplates`). The app is **zoneless**, which is what `ng new` 22
produces (`provideBrowserGlobalErrorListeners()` and `provideRouter(routes)` stand in for the
snippets' `// ...`); the `ngmodule` variant is built with the `zone.js` polyfill.

## What it reproduces

`docs/platforms/javascript/guides/angular/index.mdx` (frontmatter `sdk: sentry.javascript.angular`,
`categories: [javascript, browser]`, index.mdx:4-7; no `config.yml` in `guides/angular/`) is a
wizard-only page: its Install step is `npx @sentry/wizard@latest -i angular` (:38-40) and its Verify
step is the example component the wizard adds (:72-77). The wizard needs a Sentry login and the
network, so index.mdx itself is **not run**; what a new user who cannot run it follows is the page it
links to twice (:50, :108), `guides/angular/manual-setup.mdx`, and that is what this run reproduces
end to end, then the feature pages under `guides/angular/features/` (`error-handler.mdx`,
`component-tracking.mdx`; `index.mdx` is a `<PageGrid />` only). `angular1.mdx` is the AngularJS 1.x
page for SDK 6 and out of scope.

Where each rendered include really comes from (`javascript.angular.mdx`, else `javascript.mdx`, else
`_default.mdx`; no `javascript.angular.mdx` exists for any include the two pages reference):

| Reference | Renders from |
| --- | --- |
| `<Include name="quick-start-features-expandable" />` (index.mdx:46, manual-setup.mdx:93) | `includes/quick-start-features-expandable.mdx:20-27`, the section listing `javascript.angular`: issues, tracing, sessionReplay, logs, userFeedback |
| `<PlatformContent includePath="getting-started-tunneling" />` (index.mdx:64, manual-setup.mdx:370) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22`, snippet at 14-17 |
| `<PlatformContent includePath="getting-started-data-collection" />` (index.mdx:68, manual-setup.mdx:374) | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` (optional, not run) |
| `<PlatformContent includePath="getting-started-browser-sandbox-warning" />` (index.mdx:89, manual-setup.mdx:392) | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `<Include name="quick-start-locate-data-expandable" />` (index.mdx:91, manual-setup.mdx:467) | `includes/quick-start-locate-data-expandable.mdx` |
| `<PlatformContent includePath="getting-started-sourcemaps-short-version" />` (manual-setup.mdx:366) | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx:1-19` (wizard only, not run) |
| `<Include name="logs/javascript-quick-start-verify-logs-splitlayout" />` (manual-setup.mdx:459) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:1-28`, snippet at 12-24 |
| The Angular tracing page's enable step (`tracing/index.mdx` via `performance/enable-automatic-instrumentation`) | `platform-includes/performance/enable-automatic-instrumentation/javascript.angular.mdx:1-18` ("you will see both `pageload` and `navigation` transactions", :3) |

Snippets copied verbatim: install (manual-setup.mdx:41), `main.ts` App Config tab (:109-164, all
four product options), `app.config.ts` Angular 19+ tab (:246-275, as printed and with
`inject(Sentry.TraceService)`), `app.config.ts` Angular <=18 tab (:277-308), `main.ts` NGModule tab
(:166-220) and `app.module.ts` (:310-339), the verify button (:398-411), the tracing verify method
(:432-449), the logs lines (logs include :12-24), tunneling (tunneling include :14-17);
`error-handler.mdx:12-27` (`createErrorHandler()`, in every variant), :46-60 (`logErrors`,
`extractor`), :67-82 (`CustomErrorHandler`); `component-tracking.mdx:22-34` and :48-52 (`TraceModule`
and the `trace` directive), :60-72 (`TraceClass({ name: "Header" })`), :80-94 (`TraceMethod`), :106-133
(`TraceClass()`, `TraceMethod()` on `ngOnChanges`/`ngOnDestroy`, the `trace` directive in the card
template), :139-159 (the bootstrap span). The "Alternative TraceService setup" (:347-360, constructor
injection in an NgModule) was not run.

Every variant page carries the verify buttons (`src/app/app.component.ts`): `#btn-throw`
(manual-setup.mdx:398-411), `#btn-span` (:432-449), `#btn-log` (logs include :12-24) and `#btn-fetch`,
a probe that fetches `/recorder?from=relative` and `<origin>/recorder?from=absolute` so the sink can
record whether `sentry-trace` / `baggage` reached it under the guide's
`tracePropagationTargets: ["localhost", ...]`. Routes: `""`, `users/:id`, `plain/:id`; routed variants
open at `/users/42`. The run ends with `window.__qsSentinel('sentinel')`, `captureMessage` plus a
`sentinel-span`, and polls the sink for both; nothing sleeps.

## Install

```bash
cd $REPRO/quickstarts/angular
npm install   # package.json pins every @sentry/* to a tarball (vendor/ for @sentry/angular,
              # pack-develop-03aaf424 for the rest) and repeats them in `overrides`
```

`added 313 packages in 40s`, one registry warning: `@angular/platform-browser-dynamic@22.1.5:
@angular/platform-browser-dynamic is deprecated. Use @angular/platform-browser instead.` Installed
tree (`node_modules/@sentry`): `angular browser browser-utils conventions core feedback replay
replay-canvas`; `package-lock.json` resolves `@sentry/angular` to `file:vendor/sentry-angular-10.67.0.tgz`
and the six others to `file:../../_toolbox/pack-develop-03aaf424/...`, all `10.67.0`; only
`@sentry/conventions@0.20.0` came from the registry.

Every export the docs snippets use exists in `node_modules/@sentry/angular/index.d.ts` (ng-packagr
layout, `build/types/` does not exist): `init`, `createErrorHandler`, `SentryErrorHandler` (with
`ErrorHandlerOptions.logErrors`, `showDialog`, `dialogOptions`, `extractor`), `TraceService`,
`TraceDirective`, `TraceModule`, `TraceClass`, `TraceMethod`, `browserTracingIntegration`, and
`replayIntegration`, `feedbackIntegration`, `startSpan`, `captureException`, `logger` via
`export * from '@sentry/browser'`. **None is missing and nothing in `*.d.ts` is marked
`@deprecated`.** `TraceClass` returns a `ClassDecorator` and `TraceMethod` a `MethodDecorator`
(legacy signatures), which the CLI's `experimentalDecorators: true` tsconfig accepts.

## Run

```bash
cd $REPRO/quickstarts/angular
./run.sh base                          # manual-setup.mdx main.ts + app.config.ts (19+ tab, inject(Sentry.TraceService)) + verify, at /users/42
./run.sh app-config-verbatim           # manual-setup.mdx:246-275 as printed, build only
./run.sh app-initializer               # manual-setup.mdx:277-308 (APP_INITIALIZER tab) on Angular 22
./run.sh ngmodule                      # manual-setup.mdx:166-220 + 310-339 with zone.js, bootstrap span of component-tracking.mdx:148-158
./run.sh error-handler-custom          # error-handler.mdx:67-82 as printed, build only
./run.sh error-handler-custom-fixed    # the same with `override`, { provide: ErrorHandler, useClass: CustomErrorHandler }
./run.sh error-handler-options         # createErrorHandler({ logErrors: false, extractor })
./run.sh component-tracking            # component-tracking.mdx directive + decorators, imports fixed, at /
./run.sh component-tracking-verbatim   # component-tracking.mdx:80-94 and :106-122 as printed, build only
MODE=development ./run.sh error-handler-custom-fixed   # development build, results-error-handler-custom-fixed-dev.json
```

Each run builds `dist/<variant>/` (`build.mjs`, CLI output in `build-<variant>.log`), starts the sink
and static server on `localhost:4715` (SPA fallback to the variant's `index.html`), drives one headless
Chrome through the buttons, triggers the sentinel and polls `/__items` for it, waits for the pageload
segment span, runs the router links (or the change/destroy buttons), and writes `results-<variant>.json`
(`meta` from `Sentry.getClient()`, `steps`, `summary`, `console`, `pageErrors`, the compact sink items,
the recorder headers and the raw envelope payloads). The browser console is also in `app-<variant>.log`.
A variant that does not build writes `results-<variant>.json` with the CLI's error lines under
`build.errors` instead.

## Expected

**Install and configure**

- manual-setup.mdx:41, `npm install @sentry/angular --save`; :20 Angular 14+ (index.mdx:16 says 17+ for the wizard).
- manual-setup.mdx:103 and 109-164, `main.ts`: `Sentry.init({ dsn, integrations: [browserTracingIntegration(),
  replayIntegration(), feedbackIntegration({ colorScheme: "system" })], tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/], replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0 })`, then `bootstrapApplication(AppComponent, appConfig)`. No `release`.
- manual-setup.mdx:140-141, "Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing."
- manual-setup.mdx:234 and 246-275, `app.config.ts`: `{ provide: ErrorHandler, useValue: Sentry.createErrorHandler() }`,
  `{ provide: Sentry.TraceService, deps: [Router] }`, `provideAppInitializer(() => { inject(TraceService); })`;
  :277-308 the same with `APP_INITIALIZER`; :310-339 the NgModule form.
- tunneling include :14-17, `tunnel: "/tunnel"`.

**Verify**

- manual-setup.mdx:386 and 398-411, a `<button (click)="throwTestError()">` whose method throws `new Error("Sentry Test Error")`.
- manual-setup.mdx:424-449, tracing: "start a trace to measure the time it takes to execute your code",
  `Sentry.startSpan({ op: "test", name: "Example Span" }, () => { setTimeout(() => { throw new Error("Sentry Test Error"); }, 99); })`,
  "click the button to trigger a frontend error and performance trace"; index.mdx:77 "the button click
  starts a trace to measure the time it takes for the error to be thrown".
- logs include :12-24, `Sentry.logger.info/warn/error` with attributes.
- enable-automatic-instrumentation/javascript.angular.mdx:3, "you will see both `pageload` and `navigation` transactions".

**Feature pages**

- error-handler.mdx:6, Angular "wraps errors in its own error classes", the SDK `ErrorHandler` unwraps them;
  :50-54 `logErrors` default `true` "to ensure consistency with Angular's default behavior"; :56-60 `extractor`;
  :64-65 "you have to extend Sentry's `ErrorHandler` like in the example below", :67-82 `CustomErrorHandler`.
- component-tracking.mdx:18, the `trace` directive "adds spans called `ui.angular.init`"; :56 `TraceClass`
  "adds spans called **`ui.angular.init`**"; :74 and :96, without a `name` the spans "refer to the component
  as `<unnamed>`"; :78 `TraceMethod` spans "are called **`ui.angular.[methodname]`** (like, `ui.angular.ngOnChanges`)",
  "point-in-time spans"; :139-159 a `ui.angular.bootstrap` span around `platformBrowserDynamic().bootstrapModule()`.

**What v10-to-v11 changes about the above** (`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx`)

- :391, "Angular, Ember, and SvelteKit router spans are named `Router`"; :453 `ui.angular.routing` -> `router`.
- :455, "Angular tracing decorators: `ui.angular.init`, `ui.angular.<method>` -> `ui.mount`, `function`".

## Observed on 2026-09-09

### Step 1, install

`npm install` of the seven tarballs plus Angular 22.1.5, the CLI and the tooling succeeded with one
deprecation warning for `@angular/platform-browser-dynamic`, which only the NgModule snippets need.
**Holds**, with the toolbox tarball caveat above.

### Step 2, configure (`results-app-config-verbatim.json`, `results-base.json`, `results-app-initializer.json`, `results-ngmodule.json`)

manual-setup.mdx:246-275 as printed:

```
✘ [ERROR] TS2304: Cannot find name 'TraceService'. [plugin angular-compiler]
    src/variants/app-config-verbatim/app.config.ts:32:13:  inject(TraceService);
```

The snippet imports `ApplicationConfig, ErrorHandler, inject, provideAppInitializer` from
`@angular/core`, `Router` and `* as Sentry`, then calls `inject(TraceService)` (:270). **Does not build.**

With `inject(Sentry.TraceService)` (`base`), `main.ts` (:109-164) initializes without a warning.
`Sentry.getClient()` reports:

```json
{"SDK_VERSION":"10.67.0",
 "sdk":{"name":"sentry.javascript.angular","version":"10.67.0","packages":[{"name":"npm:@sentry/angular","version":"10.67.0"}]},
 "integrations":["EventFilters","FunctionToString","ConversationId","Breadcrumbs","GlobalHandlers","LinkedErrors","Dedupe",
                 "HttpContext","CultureContext","BrowserSession","BrowserTracing","Replay","Feedback","SpanStreaming","WebVitals"],
 "options":{"tracesSampleRate":1,"tracePropagationTargets":["localhost","/^https:\\/\\/yourserver\\.io\\/api/"],
            "replaysSessionSampleRate":0.1,"replaysOnErrorSampleRate":1,"tunnel":"/tunnel","traceLifecycle":"stream",
            "attachStacktrace":true,"debug":true},
 "angular":"22.1.5","zone":false}
```

15 integrations, no `BrowserApiErrors` (the Angular SDK leaves it out on purpose, `src/sdk.ts:28-35`),
`traceLifecycle` resolves to `"stream"`, `#sentry-feedback` is in the DOM, every event carries
`contexts.angular: {"version": 22}` and every span `angular.version: 22`. Envelope headers carry
`{"name":"sentry.javascript.angular","version":"10.67.0"}`. **Holds.**

The `APP_INITIALIZER` tab (:277-308, `app-initializer`) and the NgModule tabs (:166-220, :310-339,
`ngmodule`, with `zone.js`) produce the same 15 integrations and the same events and spans as `base`
(13 sink items each; the NgModule variant adds `ui.angular.bootstrap "bootstrap-angular-application"`,
8 ms, a child of the pageload span). `APP_INITIALIZER` and `platformBrowserDynamic` both still exist on
Angular 22; the latter is `@deprecated` in `@angular/platform-browser-dynamic/types/platform-browser-dynamic.d.ts:23`.
**Holds.**

**No session envelope is ever sent, in any run.** The snippet has no `release`, and the console shows,
twice per run: `Sentry Logger [warn]: Discarded session because of missing or non-string release`.

### Step 3, verify (`results-base.json`)

`#btn-throw` (manual-setup.mdx:398-411), the method that throws inside a `(click)` binding:

```json
{"type":"event","exception":"Error: Sentry Test Error","mechanism":"auto.function.angular.error_handler","handled":false,
 "contexts":["trace","angular","culture"],"angular":{"version":22},"transaction":"/users/:id/",
 "topFrame":{"function":"e.throwTestError","filename":"http://localhost:4715/main.js","in_app":true},
 "breadcrumbs":["navigation:","ui.click: body > app-root > button#btn-throw"]}
console: error: Error: Sentry Test Error  at e.throwTestError (http://localhost:4715/main.js:506:49938) ...
```

Angular's template listener hands the error to the Sentry `ErrorHandler`, which captures it and,
with `logErrors: true`, prints it once. **Holds.**

`#btn-span` (manual-setup.mdx:432-449):

```json
{"op":"test","name":"Example Span","status":"ok","duration_ms":0,"is_segment":false,"origin":"manual"}
{"type":"event","exception":"Error: Sentry Test Error","mechanism":"auto.browser.global_handlers.onerror","handled":false,"topFrame":{"function":"?"}}
{"op":"pageload","name":"/users/:id/","status":"error","attributes":{"sentry.status.message":"internal_error", ...}}
console: Sentry Logger [log]: [Tracing] Root span: internal_error -> Global error occurred
console: Sentry Logger [log]: Not capturing exception because it's already been captured.
console: error: Error: Sentry Test Error  at http://localhost:4715/main.js:506:50056
```

The span ends after 0 ms, before the `setTimeout` fires; 99 ms later the throw is uncaught. On a
zoneless Angular 22 app nothing routes it to the `ErrorHandler`: `GlobalHandlers` captures it as
`onerror`, marks the still-running pageload span `internal_error`, and Angular's
`provideBrowserGlobalErrorListeners()` forwards the same error to the Sentry `ErrorHandler` once more,
which `Dedupe` drops and `logErrors` prints a second time. In the NgModule variant with `zone.js` the
outcome is the same (`onerror`, one page error, no dedupe line): Angular 22 runs without
`provideZoneChangeDetection()` as zoneless even when `Zone` is loaded. The "trace to measure the time it
takes for the error to be thrown" (index.mdx:77) measures nothing, and the error and the span are only
related by the trace id. **Partial.**

Spans, one `span` envelope per segment and **no `transaction` envelope anywhere**:

```json
{"op":"pageload","name":"/users/:id/","is_segment":true,"source":"route","origin":"auto.pageload.angular","url_path":"/users/42","url_template":"/users/:id/","duration_ms":662,"attributes":{"sentry.idle_span_finish_reason":"idleTimeout"}}
{"op":"router","name":"Router","origin":"auto.ui.angular","duration_ms":4,"attributes":{"url.full":"/users/42","navigationTrigger":"imperative"}}
{"op":"navigation","name":"/","is_segment":true,"source":"route","origin":"auto.navigation.angular","url_path":"/","url_template":"/"}
{"op":"navigation","name":"/plain/:id/","is_segment":true,"source":"route","origin":"auto.navigation.angular","url_path":"/plain/5","url_template":"/plain/:id/"}
{"op":"navigation","name":"/users/:id/","is_segment":true,"source":"route","origin":"auto.navigation.angular","url_path":"/users/7","url_template":"/users/:id/"}
```

Each navigation starts as `Navigation` and is renamed on `ResolveEnd` to the parameterized route,
always with a trailing slash (`/users/:id/`), `source: route` and `url.template`; each carries one
`router` child span named `Router`. Error events carry `transaction: "/users/:id/"` and the baggage
`sentry-transaction=%2Fusers%2F%3Aid%2F`. The "transactions" of manual-setup.mdx:140-141 and of the
tracing include (:3) are `span` items here. **Holds**, with that wording gap.

`#btn-fetch`, `tracePropagationTargets: ["localhost", ...]` (manual-setup.mdx:148): both the relative
and the absolute same-origin fetch got `sentry-trace` and `baggage`; because they ran after the pageload
span had ended, each `http.client GET localhost` span is its own segment. **Holds.**

`#btn-log` (logs include :12-24): one `log` envelope, `info: User example action completed`,
`warn: Slow operation detected`, `error: Validation failed`, with the attributes. **Holds.**
manual-setup.mdx:84-91 offers no `logs` onboarding option while :457-461 is gated on it.

Replay: `[Replay] Session duration (0s) is too short, not sending replay.` for the buffer converted by
the first click; the `replay_event` only arrived after one more error past `minReplayDuration`. **Partial.**

### Step 4, error handler (`results-error-handler-custom.json`, `results-error-handler-custom-fixed.json`, `results-error-handler-custom-fixed-dev.json`, `results-error-handler-options.json`)

error-handler.mdx:67-82 as printed, in the strict tsconfig `ng new` generates:

```
✘ [ERROR] TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'SentryErrorHandler'.
    src/variants/error-handler-custom/custom-error-handler.ts:11:2:  handleError(error: any): void {
```

**Does not build.** With `override` added and registered the way a class is registered,
`{ provide: ErrorHandler, useClass: CustomErrorHandler }` (the page shows no registration):

```
production: error: q: NG0201  at No.get ... at e.ɵfac [as factory] ...
development: warning: DEPRECATED: DI is instantiating a token "CustomErrorHandler" that inherits its @Injectable decorator but does not provide one itself.
             error: RuntimeError: NG0402: A required Injectable was not found in the dependency injection tree. ...
```

The app never bootstraps (`appHtml: ""`, no `TraceService`, so the pageload span stays `Pageload` with
`source: url` and origin `auto.pageload.browser`). `SentryErrorHandler`'s factory injects the string
token `'errorHandlerOptions'` (`src/errorhandler.ts:90`, `@Inject('errorHandlerOptions')`, not optional),
the undecorated subclass inherits that factory, and nothing provides the token. **Broken as printed.**

`createErrorHandler({ logErrors: false, extractor })` (:46-60, `error-handler-options`): the same
events as `base` (`auto.function.angular.error_handler`, then the `onerror` one), `extractor` called
twice (once per error the handler saw), and no `console.error` of the error in the console. **Holds.**

### Step 5, component tracking (`results-component-tracking-verbatim.json`, `results-component-tracking.json`)

component-tracking.mdx:80-94 and :106-122 as printed (`import { Component, OnInit }` only):

```
✘ [ERROR] TS2304: Cannot find name 'OnChanges'.      ✘ [ERROR] TS2304: Cannot find name 'SimpleChanges'.
✘ [ERROR] TS2304: Cannot find name 'OnDestroy'.      ✘ [ERROR] TS2339: Property 'user' does not exist on type 'UserCardComponent'.
✘ [ERROR] NG8001: 'app-icon' is not a known element  ✘ [ERROR] NG8001: 'app-button' is not a known element
```

**Does not build.** With the imports, the `user` input and `imports: [Sentry.TraceModule, ...]` added
(`component-tracking`, opened at `/`), all under the pageload segment `/`:

```json
{"op":"ui.mount","name":"<header>","origin":"auto.ui.angular.trace_directive","duration_ms":2}
{"op":"ui.mount","name":"<articles-list>","origin":"auto.ui.angular.trace_directive","duration_ms":2}
{"op":"ui.mount","name":"<footer>","origin":"auto.ui.angular.trace_directive","duration_ms":2}
{"op":"ui.mount","name":"<user-icon>","origin":"auto.ui.angular.trace_directive"}   {"op":"ui.mount","name":"<save-user>","origin":"auto.ui.angular.trace_directive"}
{"op":"ui.mount","name":"<Header>","origin":"auto.ui.angular.trace_class_decorator","duration_ms":2}
{"op":"ui.mount","name":"<unnamed>","origin":"auto.ui.angular.trace_class_decorator","duration_ms":0}
{"op":"function","name":"<Login.ngOnChanges>","origin":"auto.ui.angular.trace_method_decorator","function":"ngOnChanges","duration_ms":0}  x3 (initial binding + two input changes)
{"op":"function","name":"<unnamed>","origin":"auto.ui.angular.trace_method_decorator","function":"ngOnChanges","duration_ms":0}
{"op":"function","name":"<unnamed>","origin":"auto.ui.angular.trace_method_decorator","function":"ngOnDestroy","duration_ms":0}
```

The directive and `TraceClass` produce `ui.mount` spans named `<trace value>` / `<name>`, not
`ui.angular.init` (:18, :56); `TraceMethod` produces `function` spans named `<name>` with
`code.function.name: ngOnChanges`, not `ui.angular.ngOnChanges` (:78); the migration page (:455)
documents both renames, the feature page does not. `<unnamed>` without a `name` (:74, :96) holds.
**Partial.**

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/angular --save` is all you need (manual-setup.mdx:41) | **yes** (from a working tarball) |
| The `main.ts` snippet initializes the SDK (manual-setup.mdx:109-164) | **yes**, 15 integrations, `traceLifecycle: "stream"`, feedback widget in the DOM |
| `app.config.ts` Angular 19+ tab runs as printed (manual-setup.mdx:246-275) | **no**, `TS2304: Cannot find name 'TraceService'` |
| The same with `inject(Sentry.TraceService)` | **yes** |
| `APP_INITIALIZER` tab on Angular 22 (manual-setup.mdx:277-308) | **yes** |
| NgModule tabs (manual-setup.mdx:166-220, 310-339) | **yes**, `platformBrowserDynamic` is deprecated |
| `tracePropagationTargets: ["localhost", …]` propagates the trace (manual-setup.mdx:148) | **yes**, relative and absolute same-origin fetches both got `sentry-trace` and `baggage` |
| The verify button creates an issue (manual-setup.mdx:386, 398-411) | **yes**, `auto.function.angular.error_handler` with `contexts.angular` |
| The tracing verify button measures the time until the error (manual-setup.mdx:424-449, index.mdx:77) | **partial**, a 0 ms `test` span; the error arrives 99 ms later via `onerror` and marks the pageload `internal_error` |
| "capture 100% of transactions", "pageload and navigation transactions" (manual-setup.mdx:140-141, tracing include :3) | **partial**, everything is a `span` item; `pageload` / `navigation` segments named after the route, `router` children named `Router` |
| `Sentry.logger.*` reaches Sentry (logs include :12-24) | **yes** |
| `tunnel` forwards events (tunneling include :14-17) | **yes**, every envelope of every run came through `/tunnel` |
| Session Replay of the first error | **partial**, "Session duration (0s) is too short", later errors ship a replay |
| `createErrorHandler()` and `logErrors` / `extractor` (error-handler.mdx:12-27, 46-60) | **yes** |
| `CustomErrorHandler extends Sentry.SentryErrorHandler` (error-handler.mdx:67-82) | **no**, TS4114 as printed; with `override` and `useClass`, NG0201 / NG0402 and the app never bootstraps |
| `trace` directive and `TraceClass` add `ui.angular.init` spans (component-tracking.mdx:18, 56) | **no**, `ui.mount` named `<header>` / `<Header>` |
| `TraceMethod` adds `ui.angular.[methodname]` spans (component-tracking.mdx:78) | **no**, `function` named `<Login.ngOnChanges>` with `code.function.name` |
| `<unnamed>` without a `name` (component-tracking.mdx:74, 96) | **yes** |
| component-tracking.mdx:80-94 and :106-122 run as printed | **no**, `OnChanges`, `SimpleChanges`, `OnDestroy` not imported |
| Bootstrap span (component-tracking.mdx:139-159) | **yes**, `ui.angular.bootstrap` 8 ms under the pageload |
| Release Health sessions | **no**, no `release` in the snippet, "Discarded session because of missing or non-string release" |

## Findings

1. **P0, docs wrong**, `manual-setup.mdx:269-271`: `provideAppInitializer(() => { inject(TraceService); })`
   references `TraceService`, which the snippet never imports; `ng build` fails with `TS2304: Cannot
   find name 'TraceService'`. Fix: `inject(Sentry.TraceService)`.
2. **P0, docs wrong**, `features/error-handler.mdx:76`: `handleError(error: any): void` in the
   `CustomErrorHandler` lacks the `override` modifier, so the strict tsconfig `ng new` generates
   (`noImplicitOverride: true`) rejects it with TS4114. Fix: `override handleError(error: any): void`.
3. **P0, docs wrong**, `features/component-tracking.mdx:81-93, 107-121`: both snippets import only
   `Component, OnInit` but use `OnChanges`, `SimpleChanges` and `OnDestroy` (TS2304 x3), and the
   card template (:127-132) reads `user.name` and uses `app-icon` / `app-button` that nothing defines
   (TS2339, NG8001). Fix: import `Input, OnChanges, OnDestroy, SimpleChanges`, drop `OnInit`, and
   declare the input.
4. **P1, docs wrong**, `features/error-handler.mdx:62-82`: the page says to extend
   `Sentry.SentryErrorHandler` but never shows how to register the subclass; registered as
   `{ provide: ErrorHandler, useClass: CustomErrorHandler }` the app never bootstraps (`NG0201` in
   production, `DEPRECATED: DI is instantiating a token "CustomErrorHandler" that inherits its
   @Injectable decorator` plus `NG0402` in development), because the inherited factory injects the
   unprovided `'errorHandlerOptions'` token. Fix: show the registration as
   `{ provide: ErrorHandler, useValue: new CustomErrorHandler() }`.
5. **P1, docs wrong**, `features/component-tracking.mdx:18, 56`: the `trace` directive and `TraceClass`
   add `ui.mount` spans named `<header>` / `<Header>` (origins `auto.ui.angular.trace_directive`,
   `auto.ui.angular.trace_class_decorator`), not `ui.angular.init`; the migration page (:455)
   documents the rename. Fix: rename the op and add the span names.
6. **P1, docs wrong**, `features/component-tracking.mdx:78`: `TraceMethod` adds `function` spans named
   `<Login.ngOnChanges>` with `code.function.name: ngOnChanges`, not `ui.angular.ngOnChanges`. Fix:
   rename and mention the attribute.
7. **P2, docs wrong**, `manual-setup.mdx:424-449` and `index.mdx:77`: the `Example Span` ends after 0 ms
   and the throw happens 99 ms later outside it; on Angular 22 (zoneless by default, also with
   `zone.js` loaded) it is captured by `GlobalHandlers` as `auto.browser.global_handlers.onerror`,
   marks the pageload span `internal_error`, and is logged twice. Fix: an async callback that awaits
   the timeout inside the span, as the Vue guide's verify snippet does.
8. **P2, docs wrong**, `manual-setup.mdx:140-141`, `features/component-tracking.mdx:14`,
   `performance/enable-automatic-instrumentation/javascript.angular.mdx:3`: "transactions" everywhere,
   while develop sends `span` envelope items, `pageload` / `navigation` segments named after the
   parameterized route with a trailing slash (`/users/:id/`) and a `router` child named `Router`, and
   no `transaction` envelope. Fix: say "root spans / traces" and show the names.
9. **P2, docs wrong**, `features/component-tracking.mdx:139-159` and `manual-setup.mdx:166-220`:
   `platformBrowserDynamic` from `@angular/platform-browser-dynamic` is deprecated in Angular 22
   (npm deprecation notice, `@deprecated` in its types); it still works. Fix: use `platformBrowser()`
   from `@angular/platform-browser`.
10. **P2, SDK limit**, `manual-setup.mdx:109-164`: no `release` in the snippet, so every session is
    discarded ("Discarded session because of missing or non-string release") and Release Health stays
    empty. Fix: add `release` to the snippet or a one-line note.
11. **P2, docs wrong**, `manual-setup.mdx:457-461`: the logs verify step is gated on a `logs`
    onboarding option that the page's `OnboardingOptionButtons` (:84-91) does not offer, although
    `Sentry.logger.*` works. Fix: add `"logs"` to the options.

Notes, not findings: `features/error-handler.mdx:26` ends the App Config snippet with a stray
`export class AppModule {}` (not compiled here). The first-error replay is dropped as "too short"
(:pattern of the browser, React and Vue runs). The `favicon.ico` 404 in every console log is harness
noise. The two `console.error` lines per `#btn-throw` in the standalone variants are the
`ErrorHandler`'s `logErrors` output plus, for the `setTimeout` throw, the browser's own uncaught-error
log.

## Files

`package.json`, `vendor/sentry-angular-10.67.0.tgz` (the built `@sentry/angular`), `angular.json`
(one project, one configuration per variant), `tsconfig.json`, `src/index.html`,
`src/index-ngmodule.html`, `src/harness.ts` (the driver hooks), `src/app/` (`app.component.ts`, the
verify snippets; `app.routes.ts`, `pages.ts`), one directory per variant under `src/variants/` (each
with its `main.ts`, `app.config.ts` or `app.module.ts`, `tsconfig.json`), `build.mjs` (runs `ng build`
and records failures), `drive.mjs` (the Playwright driver), `run.sh`, and `sink.mjs`, a copy of
`../vue/sink.mjs` serving `dist/<variant>/` on port 4715 with `contexts.angular` in the compact
mapping. `results-<variant>.json`, `app-<variant>.log`, `build-<variant>.log` and `sink-<variant>.log`
are the runs; `results-app-config-verbatim.json`, `results-error-handler-custom.json` and
`results-component-tracking-verbatim.json` hold the CLI's errors.

`node_modules/` (251 MB) and `dist/` are left in place from the run; the Install and Run sections
recreate them from scratch if they are removed.
