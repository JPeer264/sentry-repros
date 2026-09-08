# QS-browser — plain browser JavaScript getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/` (the 2026-09-08 pin,
**not** `../../_toolbox/pack/`). The CDN variants use the bundles built from the same commit in
`../../_toolbox/bundles-develop-03aaf424/`.

Google Chrome 152.0.7977.83 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `esbuild` 0.25.9, node v26.5.0, macOS 15.7.7 (Darwin 24.6.0).
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

## What it reproduces

A new user following the browser JavaScript quickstart end to end: pick the features, install
`@sentry/browser`, paste `Sentry.init`, and run the verify step. The guide is
`~/dev/sentry-docs/docs/platforms/javascript/common/index.mdx` (there is no
`docs/platforms/javascript/index.mdx`; the browser platform renders `common/index.mdx` with
`config.yml` `sdk: sentry.javascript.browser`). For the `javascript` platform the page renders
`platform-includes/getting-started-complete/javascript.mdx`, which pulls in
`getting-started-prerequisites/_default.mdx`, `getting-started-install/javascript.mdx`,
`getting-started-config/javascript.mdx`, `getting-started-sourcemaps-short-version`,
`getting-started-tunneling/javascript.mdx`, `getting-started-data-collection` and
`getting-started-verify/javascript.mdx`.

The page under test carries five buttons, all driven by Playwright, plus a `history.pushState`
navigation and a second error at the end:

| Button | What it does |
| --- | --- |
| `#btn-throw` | `<button onclick="triggerError()">Break the World</button>`, where `triggerError` throws — the guide's errors-only verify snippet, uncaught, for the global handlers |
| `#btn-capture` | `Sentry.captureException(new Error(...))` |
| `#btn-span` | `Sentry.startSpan({ name: "Example Frontend Span", op: "test" }, ...)` around a same-origin `fetch` to the sink's `/recorder`, which records the inbound `sentry-trace` / `baggage` headers |
| `#btn-log` | `Sentry.logger.info(...)` |
| `#btn-sentinel` | `Sentry.captureMessage("sentinel")` plus a `sentinel-span` — the run polls for these in the sink instead of sleeping |

`public/docs-snippet.html` is a sixth page with no SDK on it at all. It holds the guide's tracing
verify snippet verbatim, so that a real browser parses exactly what the docs print.

The sink (`sink.mjs`) also serves the page, so page and envelope endpoint share an origin; it sends
`Access-Control-Allow-Origin: *` and answers `OPTIONS` anyway, and serves the local CDN bundles under
`/vendor/` in place of `https://browser.sentry-cdn.com/<version>/`.

## Install

```bash
cd $REPRO/quickstarts/browser
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
              # and repeats them in `overrides`
```

`package.json` needs the `overrides` block because npm otherwise resolves the tarballs' transitive
`@sentry/*@10.67.0` deps against the registry. Installed tree (`node_modules/@sentry`):
`browser browser-utils core feedback replay replay-canvas`, all `10.67.0` from
`file:../../_toolbox/pack-develop-03aaf424/…`, plus `@sentry/conventions@0.20.0` from the registry as
a normal published dependency. No `@sentry/*` SDK package came from the registry
(`package-lock.json` has no non-toolbox `@sentry/*` `resolved` entry other than `conventions`).
`esbuild` and `playwright-core` come from the registry as tooling.

## Run

```bash
cd $REPRO/quickstarts/browser
./run.sh npm          # esbuild ESM bundle of `import * as Sentry from "@sentry/browser"`
./run.sh cdn          # <script src="/vendor/bundle.tracing.replay.min.js"> + the CDN tab's inline init
./run.sh cdn-tracing  # the CDN tab exactly as the guide prints it: bundle.tracing.min.js + replayIntegration()
./run.sh cjs          # esbuild IIFE bundle of `const Sentry = require("@sentry/browser")`
./run.sh late         # Sentry.init after the first errors, DSN fetched from /dsn
./run.sh npm-ip       # the npm page reached over 127.0.0.1 instead of localhost
```

Each run builds the variant's bundle (except the two CDN ones), starts the sink and static server on
`[::]:41701`, drives one headless Chrome through the buttons, polls `/__items` until the sentinel
event, the sentinel span and the log batch have arrived, then polls for the pageload span, the
navigation span and the replay envelope, and writes `results-<variant>.json` (sink items, the raw
envelope payloads, the headers the recorder saw, plus three snapshots: `itemsAfterVerify`,
`itemsAfterNavigation`, `items`). The browser console for a variant is in `app-<variant>.log`.
The loader-script variant is not runnable, see below.

## Expected

Quoted from the guide and the install pages, adjusted where
`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx` changes the expectation.

**Install**

- `platform-includes/getting-started-install/javascript.mdx:16` — `npm install @sentry/browser --save`.
- `platform-includes/getting-started-install/javascript.mdx:1` — "We recommend installing Sentry via a
  package manager. If that isn't an option for you, you can use the [Loader Script]… or a CDN bundle."
- `platform-includes/getting-started-install/javascript.mdx:41` — "Sentry provides different bundles
  that include specific feature combinations."
- `docs/platforms/javascript/common/install/npm.mdx:54` — `npm install @sentry/browser --save`.

**Configure**

- `platform-includes/getting-started-config/javascript.mdx:7` — "Initialize Sentry as early as possible
  in your application's lifecycle."
- `platform-includes/getting-started-config/javascript.mdx:14-57` — the npm snippet:
  `import * as Sentry from "@sentry/browser"`, `release: "my-project-name@2.3.12"`,
  `integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()]`,
  `tracesSampleRate: 1.0`,
  `tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/]`,
  `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`.
- `platform-includes/getting-started-config/javascript.mdx:116` — the CDN tab loads
  `https://browser.sentry-cdn.com/<version>/bundle.tracing.min.js`, and lines 130 and 133 of the *same*
  snippet add `Sentry.browserTracingIntegration()` **and** `Sentry.replayIntegration()`.
- `platform-includes/getting-started-tunneling/javascript.mdx:5` — "Use the `tunnel` option in
  `Sentry.init` to add an API endpoint in your application that forwards Sentry events."

**Verify**

- `platform-includes/getting-started-verify/javascript.mdx:10` — "add a button that throws an error
  when clicked", snippet at lines 22-30:
  `function triggerError() { throw new Error("Sentry Test Error"); }` +
  `<button onclick="triggerError()">Break the World</button>`.
- `platform-includes/getting-started-verify/javascript.mdx:45-47` — "To test your tracing
  configuration, update the previous code to simulate a longer operation and start a trace. Open the
  page in a browser and click the button to throw an error and create a trace." Snippet at lines 53-68.
- `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` — `Sentry.logger.info("User
  example action completed");`
- `platform-includes/getting-started-complete/javascript.mdx:44` — "Now, head over to your project on
  Sentry.io to view the collected data".

**Install variants**

- `docs/platforms/javascript/common/install/loader.mdx:47` — the loader is copied out of
  **Settings > Projects > (select project) > SDK Setup > Loader Script** and served from
  `https://<JS_SDK_LOADER_HOST>/<PUBLIC_KEY>.min.js`.
- `loader.mdx:81-89` — errors-only loaders load the full SDK lazily, on the first unhandled error,
  unhandled rejection, `captureException`, `captureMessage` or `captureEvent`.
- `loader.mdx:103` — "If Tracing and/or Session Replay is enabled, the SDK will immediately fetch and
  initialize the bundle".
- `loader.mdx:111-113` — loader defaults `tracesSampleRate: 1`, `replaysSessionSampleRate: 0.1`,
  `replaysOnErrorSampleRate: 1`.
- `loader.mdx:129-131` — `window.sentryOnLoad` is called first, before any other SDK method, and must
  be defined before the loader script tag.
- `loader.mdx:167-176` — the loader guarantees `captureException`, `captureMessage`, `captureEvent`,
  `addBreadcrumb`, `withScope` and `showReportDialog` at any time; anything else must be wrapped in
  `Sentry.onLoad()`.
- `loader.mdx:261-267` — the Performance & Replay bundle is `bundle.tracing.replay.min.js`.
- `loader.mdx:423-435` — three varieties per version: `.min` (no debug logging), unminified, and
  `.debug.min`.
- `docs/platforms/javascript/common/install/commonjs.mdx:20-21` — "CommonJS uses `require()` to load
  modules."
- `docs/platforms/javascript/common/install/late-initialization.mdx:20-22` — init must run as early as
  possible; when it can't, "you can use the `@sentry/node/preload` hook to ensure modules are wrapped
  early, which allows you to call `Sentry.init()` later at a time of your choosing."
- `docs/platforms/javascript/common/install/lightweight.mdx:25` — "you can use
  `@sentry/node-core/light` which doesn't require OpenTelemetry dependencies", installed with
  `npm install @sentry/node-core` (line 44), and `otlpIntegration` from
  `@sentry/node-core/light/otlp` (line 158).
- `docs/platforms/javascript/common/install/esm-without-import.mdx:21` — direct imports or the SEA
  bootstrap when `--import` is not available.

**What v10-to-v11 changes about the above**

- `migration/v10-to-v11/index.mdx:192` — "Transactions no longer exist: what used to be one
  transaction event is a service span with its child spans." So the verify step must produce a `span`
  envelope, not a `transaction` envelope.
- `:350` and `:356` — `pageload` and `navigation` names fall back to `Pageload` and `Navigation`;
  `:344` — "URLs, route parameters, and other client-supplied values are no longer part of the name";
  `:360` — what the name drops stays on `url.full` and `url.domain`.
- `:348` — `http.client` is named `GET api.example.com`, not `GET https://api.example.com/users/123`.
- `:493-499` — `ui.long-task` → `ui.long_animation_frame`, `browser.domContentLoadedEvent` →
  `browser.dom_content_loaded_event`, `browser.DNS` → `browser.dns`, and so on.
- `:457` — `paint` → `browser.paint`.
- `:840` — `captureMessage()` attaches a synthetic stack trace by default.
- `:853` — "Sessions affected by an uncaught error are recorded as `unhandled` instead of `crashed`."
- `:854` — "The `lifecycle` mode of `browserSessionIntegration` defaults to `'page'`, so a session is
  created on page load and is not renewed on navigation."
- `:816` — `enableLogs` and `enableMetrics` were removed; logs and metrics are captured whenever their
  APIs are used.
- `:926-927` — CLS and LCP are dedicated spans in stream mode; INP carries its value in
  `browser.web_vital.inp.value`.
- `:875-880` — `tracePropagationTargets` matching is case-insensitive now.
- `:1398` — "**Metrics moved out of the base CDN bundle.** They ship only in the `*.logs.metrics`
  bundles now. On the other bundles, `Sentry.metrics.*` is a no-op that warns in debug builds."
- `:1359` — "The `init`, `preload`, and `loader` entry points were removed from every server SDK",
  which retires the `@sentry/node/preload` hook that `late-initialization.mdx` is built on.
- `:1396` — "`@sentry/node-core` was merged back into `@sentry/node`", which retires
  `lightweight.mdx`.
- `:677` — the v10 `otlpIntegration` "was renamed to `openTelemetryIntegration()`".

**Which install pages the browser guide actually shows.** Only `install/index.mdx`, `install/npm.mdx`
and `install/loader.mdx` render for platform `javascript`; their `notSupported` frontmatter does not
list it. `commonjs.mdx:5-12`, `esm.mdx:5-12`, `esm-without-import.mdx:5-12`,
`late-initialization.mdx:5-12` and `lightweight.mdx:5-12` all carry
`supported: [javascript.node, javascript.connect, javascript.express, javascript.fastify,
javascript.hapi, javascript.hono, javascript.koa]`, so a browser reader never sees them. They are
still exercised below, because the task asks for them, but the browser-side verdict for each is
"the page does not apply to this platform" on top of whatever the run showed.

## Observed on 2026-09-08

### Step 1 — Install

`npm install` of the six develop tarballs plus esbuild and playwright-core succeeded with no peer or
version complaints (`added 11 packages, and audited 12 packages in 6s`). `@sentry/browser@10.67.0`
pulls `@sentry/browser-utils`, `@sentry/core`, `@sentry/feedback`, `@sentry/replay` and
`@sentry/replay-canvas` at the same version, so one `npm install @sentry/browser` is genuinely all a
reader needs. **Holds.**

### Step 2 — Configure

The npm snippet from `getting-started-config/javascript.mdx:14-57` initializes without a warning.
`window.Sentry.getClient()` reports:

```json
{"sdk":{"name":"sentry.javascript.browser","version":"10.67.0",
        "packages":[{"name":"npm:@sentry/browser","version":"10.67.0"}]},
 "integrations":["EventFilters","FunctionToString","ConversationId","BrowserApiErrors","Breadcrumbs",
                 "GlobalHandlers","LinkedErrors","Dedupe","HttpContext","CultureContext",
                 "BrowserSession","BrowserTracing","Replay","SpanStreaming","WebVitals"],
 "options":{"release":"my-project-name@2.3.12","tracesSampleRate":1,
            "replaysSessionSampleRate":0.1,"replaysOnErrorSampleRate":1,"tunnel":"/tunnel",
            "traceLifecycle":"stream","attachStacktrace":true}}
```

15 integrations. `traceLifecycle` resolves to `"stream"` and `attachStacktrace` to `true` without
either being set, which is what the v11 migration page predicts. `enableLogs`, `sendDefaultPii` and
`dataCollection` are all absent from the resolved options. **Holds.**

`debug: true` prints one `Integration installed: <name>` line per integration and the tracing and
replay lifecycle, but **no SDK name, no SDK version and no browser version** — the same gap the Node
quickstart found. The identity had to be read off the envelopes.

### Step 3 — Verify, variant `npm` (`results-npm.json`)

**The guide's tracing verify snippet does not parse.** `public/docs-snippet.html` holds
`getting-started-verify/javascript.mdx:53-68` verbatim; Chrome reports:

```json
{"defined": false,
 "errors": ["Uncaught SyntaxError: await is only valid in async functions and the top level bodies of modules"]}
```

`function triggerError() { await Sentry.startSpan(...) }` is a non-`async` function containing
`await`. The whole `<script>` block is discarded, `triggerError` is never defined, and the
"Break the World" button next to it throws `ReferenceError` instead of the test error. The
errors-only snippet at lines 22-30 is fine; only the tracing version at 53-68 is broken.
Everything below therefore uses the errors-only snippet's shape with a working body.

Error events, verbatim and trimmed from `/__items`:

```json
{"type":"event","exception":"Error: Sentry Test Error (captureException)","mechanism":"generic","handled":true,
 "sdk":"sentry.javascript.browser","sdk_version":"10.67.0","transaction":"/",
 "trace_id":"343d3bec37c44088b2ac0919d1dab8cf","tags":{"replayId":"b9ed0ced8e7e4b268f88251802ca8b69"},
 "release":"my-project-name@2.3.12","environment":"production","hasContextLine":false,
 "topFrame":{"function":"HTMLButtonElement.<anonymous>","filename":"http://localhost:41701/buttons.js","in_app":true},
 "request":{"url":"http://localhost:41701/","hasData":false,
            "headers":{"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36"}}}
{"type":"event","exception":"Error: Sentry Test Error","mechanism":"auto.browser.global_handlers.onerror","handled":false,
 "sdk":"sentry.javascript.browser","sdk_version":"10.67.0","transaction":"/",
 "trace_id":"343d3bec37c44088b2ac0919d1dab8cf","tags":{"replayId":"b9ed0ced8e7e4b268f88251802ca8b69"},
 "topFrame":{"function":"window.triggerError","filename":"http://localhost:41701/buttons.js","in_app":true}}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,
 "synthetic":true,"sdk":"sentry.javascript.browser","sdk_version":"10.67.0","transaction":"/"}
```

The uncaught throw reaches Sentry through `GlobalHandlers` with `handled: false` and mechanism
`auto.browser.global_handlers.onerror` (v10 used the bare `onerror`). `captureMessage("sentinel")`
carries `"synthetic": true`, which is the `attachStacktrace` default from migration `:840`.

**No `contexts.browser`, `contexts.os` or `contexts.device` is sent by any variant.** Across all six
results files the only context keys on any item are `trace` and `culture`
(`{"locale":"en-US","timezone":"Europe/Vienna","calendar":"gregory"}`). The browser and OS are left to
be inferred from `request.headers["User-Agent"]`, which the event does carry.

Spans — one `span` envelope, no `transaction` envelope anywhere in any variant:

```json
{"type":"span","sdk":"sentry.javascript.browser","sdk_version":"10.67.0",
 "trace_id":"343d3bec37c44088b2ac0919d1dab8cf",
 "items":["test Example Frontend Span","test sentinel-span","http.client GET localhost",
          "browser.unload_event http://localhost:41701/","browser.dom_content_loaded_event http://localhost:41701/",
          "browser.load_event http://localhost:41701/","browser.connect http://localhost:41701/",
          "browser.cache http://localhost:41701/","browser.dns http://localhost:41701/",
          "browser.request http://localhost:41701/","browser.response http://localhost:41701/",
          "resource.script localhost","resource.script localhost",
          "browser.paint first-paint","browser.paint first-contentful-paint","pageload Pageload"]}
```

The pageload segment span, with the fields the guide's "view the collected data" step is about:

```json
{"name":"Pageload","is_segment":true,"status":"error","source":"url","segment_name":"Pageload",
 "url_path":"/","url_full":"http://localhost:41701/","lifecycle":"stream"}
```

`op` is `pageload`, `origin` `auto.pageload.browser`, `sentry.idle_span_finish_reason`
`idleTimeout`, and the web vitals ride along as attributes (`browser.web_vital.ttfb.value`,
`browser.web_vital.fp.value`, `browser.web_vital.fcp.value`). Note `sentry.segment.name.source` is
`"url"` while the name is the generic fallback `Pageload` — the source attribute describes where the
name *would* have come from, not the name that shipped.

Every span op follows the v11 snake_case renames of migration `:493-499` and `:457`. The ops seen
across the run are `test http.client browser.unload_event browser.dom_content_loaded_event
browser.load_event browser.connect browser.cache browser.dns browser.request browser.response
resource.script browser.paint pageload navigation ui.webvital.lcp ui.webvital.cls`, plus
`ui.long_animation_frame` when the run happens to record a long frame (the `cjs` run did).
`http.client` is named `GET localhost`, method plus domain, per migration `:348`.

The `http.client` span and the recorded headers:

```json
{"name":"GET localhost","op":"http.client","status":"ok","is_segment":false,
 "origin":"auto.http.browser","url":"http://localhost:41701/recorder?from=span",
 "method":"GET","status_code":200}
```

```json
{"url":"/recorder?from=span",
 "sentry-trace":"343d3bec37c44088b2ac0919d1dab8cf-a9cb8410dcf8c375-1",
 "baggage":"sentry-environment=production,sentry-release=my-project-name%402.3.12,sentry-public_key=1234567890abcdef1234567890abcdef,sentry-trace_id=343d3bec37c44088b2ac0919d1dab8cf,sentry-org_id=0,sentry-replay_id=b9ed0ced8e7e4b268f88251802ca8b69,sentry-sampled=true,sentry-sample_rand=0.44088778637094295,sentry-sample_rate=1",
 "traceparent":null}
```

Both propagation headers arrive, and the baggage carries `sentry-replay_id`. `traceparent` is not
sent.

Log item:

```json
{"type":"log","items":["info: hello from the browser quickstart"]}
```

Session envelopes, all three with the same `sid`:

```json
{"type":"session","status":"ok","errors":0,"init":true,"sid":"d73615cc…",
 "attrs":{"release":"my-project-name@2.3.12","environment":"production","ip_address":"{{auto}}",
          "user_agent":"Mozilla/5.0 (Macintosh; …) HeadlessChrome/152.0.0.0 Safari/537.36"}}
{"type":"session","status":"ok","errors":1,"init":false,"sid":"d73615cc…"}
{"type":"session","status":"unhandled","errors":1,"init":false,"sid":"d73615cc…"}
```

`status: "unhandled"` after the uncaught throw confirms migration `:853`. The `page` lifecycle of
`:854` is confirmed by the navigation probe: after `history.pushState({}, '', '/probe/42')` the sink
gets **no** new session envelope and no `init: true`; the same `sid` keeps being updated, while the
trace id changes (`343d3bec…` → `f5e4cde6…`) and a new segment span arrives:

```json
{"name":"Navigation","is_segment":true,"status":"ok","source":"url","segment_name":"Navigation",
 "url_path":"/probe/42","url_full":"http://localhost:41701/probe/42","lifecycle":"stream"}
```

**Replay is dropped for a reader who follows the guide literally.** The first error lands within a
second of page load and the buffered replay is discarded:

```
[Replay]  Starting replay in buffer mode
[Replay]  Converting buffer to session
[Replay]  Session duration (0s) is too short, not sending replay.
```

Events still carry `tags.replayId` and the baggage still carries `sentry-replay_id`, so the reader
sees a replay id on the issue with no replay behind it. Only the later error, once the page had been
open past `minReplayDuration` (5s), produced envelopes:

```json
{"type":"replay_event","replay_type":"buffer","segment_id":0,"sdk":"sentry.javascript.browser",
 "sdk_version":"10.67.0","error_ids":4,"trace_ids":1,
 "urls":["http://localhost:41701/","http://localhost:41701/probe/42"]}
{"type":"replay_recording"}
```

Web vitals arrive as their own spans after the pageload segment, as migration `:926` says:

```json
{"type":"span","items":["ui.webvital.lcp body > h1","ui.webvital.cls Layout shift"]}
```

with `browser.web_vital.lcp.value`, `.element`, `.load_time`, `.render_time`, `.size` and
`browser.web_vital.cls.value` as attributes. No INP span: headless Chrome records no interaction
latency here.

### Step 3b — `tracePropagationTargets` on 127.0.0.1 (`results-npm-ip.json`)

The same page, same config, reached over `http://127.0.0.1:41701/` instead of `http://localhost:41701/`.
The documented `tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/]` does not
match, and the recorder sees:

```json
{"url":"/recorder?from=span","sentry-trace":null,"baggage":null,"traceparent":null}
```

while the client span is still created:

```json
{"name":"GET 127.0.0.1","op":"http.client","status":"ok","is_segment":false,
 "origin":"auto.http.browser","url":"http://127.0.0.1:41701/recorder?from=span","status_code":200}
```

Everything else is identical to the `npm` run. The case-insensitive matching of migration `:875` does
not help here: `127.0.0.1` is not a casing problem, it is a different host, and the snippet a reader
copies has no entry for it.

### Step 4 — Variant `cdn` (`results-cdn.json`)

`<script src="/vendor/bundle.tracing.replay.min.js">` plus the CDN tab's inline `Sentry.init`. The
docs name `https://browser.sentry-cdn.com/<version>/bundle.tracing.replay.min.js` with an `integrity`
hash (`loader.mdx:261-267`); the local develop build is substituted and `integrity` dropped, since no
SRI hash is published for it.

Same 15 integrations, same event, span, session and replay shapes as `npm`, with
`"packages":[{"name":"cdn:@sentry/browser","version":"10.67.0"}]`. Two differences:

**`Sentry.logger.*` is a silent no-op on this bundle.** Clicking `#btn-log` throws nothing and sends
nothing: the run has no `log` item at all, and the driver reports
`[drive] gave up waiting for sentinel event, log item and sentinel span` while the sentinel event and
sentinel span did arrive. In the bundle source both APIs are empty functions:

```js
function xo(t,e){}
const Eo={trace:xo,debug:xo,info:xo,warn:xo,error:xo,fatal:xo,fmt:function(t,...e){return""}}
function Ro(t,e,n){}
const Oo={count:Ro,gauge:Ro,distribution:Ro}
… t.logger=Eo, t.metrics=Oo
```

Migration `:1398` documents this for `Sentry.metrics.*` ("a no-op that warns in debug builds") and
`loader.mdx:406-417` lists `bundle.logs.metrics.*` as the bundle for logs, but nothing anywhere says
`Sentry.logger.*` is dropped from the tracing and replay bundles, and on a `.min` bundle it does not
even warn.

**`debug: true` warns instead of logging**, which follows from `loader.mdx:423-435` but is not stated
where `debug` is set:

```
warning: [Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.
```

### Step 4b — Variant `cdn-tracing`, the CDN tab exactly as the guide prints it (`results-cdn-tracing.json`)

`getting-started-config/javascript.mdx:116` loads `bundle.tracing.min.js`, and lines 130 and 133 of the
same snippet add `Sentry.replayIntegration()` when the session-replay option is selected. That bundle
has no replay in it. Only a console warning marks the difference:

```
warning: You are using replayIntegration() even though this bundle does not include replay.
warning: [Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.
```

Everything downstream looks like replay is on and is not:

```
integrations: ["EventFilters","FunctionToString","ConversationId","BrowserApiErrors","Breadcrumbs",
               "GlobalHandlers","LinkedErrors","Dedupe","HttpContext","CultureContext",
               "BrowserSession","BrowserTracing","Replay","SpanStreaming","WebVitals"]
replayId tag on first event: undefined
item types: ["session","session","event","session","event","event","span","event","span","event","span"]
```

`Replay` is in the integration list, no event carries a `replayId` tag, and no `replay_event` ever
arrives (`replay=false` after the bounded wait). The other bundles ship the same kind of shim:
`bundle.min.js` warns for `browserTracingIntegration`, `replayIntegration`,
`fetchStreamPerformanceIntegration`, `spanStreamingIntegration`, `elementTimingIntegration` and
`feedbackIntegration`; `bundle.tracing.min.js` for `replayIntegration`, `feedbackIntegration` and
`elementTimingIntegration`; `bundle.tracing.replay.min.js` for `feedbackIntegration` and
`elementTimingIntegration`. Logs, spans and errors are unaffected — this run's five events, three
`span` envelopes and three session envelopes match the `cdn` run.

### Step 5 — Loader script: not run

`loader.mdx:47` gets the script tag out of the Sentry UI, and the file is served from
`https://<JS_SDK_LOADER_HOST>/<PUBLIC_KEY>.min.js`, generated per project by the Sentry server
(`getsentry/sentry`, `src/sentry/templates/sentry/js-sdk-loader.ts`, linked at `loader.mdx:205`). It
resolves the SDK version from the release registry and the DSN from the public key, so **there is no
way to point it at a `develop` build**, and no develop artifact for it exists in
`_toolbox/bundles-develop-03aaf424/` (only the four `bundle*.min.js` files). **Not run.**

What the page claims, and what develop does provide:

- `window.sentryOnLoad` (`loader.mdx:129-163`) appears **nowhere** in the develop `@sentry/browser`
  package or in any of the four CDN bundles (`grep -c sentryOnLoad` is 0 for all four). It is purely a
  loader construct; nothing in the SDK reads it. Not verifiable here.
- `Sentry.onLoad()` and `Sentry.forceLoad()` (`loader.mdx:101`, `:176-198`) **do** exist in the npm
  package, as the compatibility shims that make loader-guarded code work when the SDK is loaded
  eagerly (`node_modules/@sentry/browser/build/npm/esm/prod/sdk.js:47-51`):

  ```js
  function forceLoad() {
  }
  function onLoad(callback) {
    callback();
  }
  ```

  So the `Sentry.onLoad(...)` guard the page tells readers to write is a straight passthrough outside
  the loader. **Holds** for the npm and CDN paths.
- Lazy loading on the first error, `data-lazy="no"`, the loader's default sample rates
  (`tracesSampleRate: 1`, `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1`), and the
  errors-only breadcrumb limitation (`loader.mdx:81-113`, `:201-239`) are all properties of the
  server-generated script. **Not run.**

### Step 6 — Variant `late` (`results-late.json`)

`late-initialization.mdx` is a Node page (`:5-12`) and its whole mechanism, the `@sentry/node/preload`
hook, was removed in v11 (migration `:1359`; the develop `@sentry/node` tarball's `exports` map is
`. ./import ./vite ./rollup ./webpack ./esbuild`, with no `./preload`). The browser has no equivalent
at all, so this variant reproduces the shape rather than the API: an entry that throws before `init`,
fetches its DSN from `/dsn`, then initializes.

Chrome saw four page errors:

```
Uncaught error before Sentry.init
Unhandled rejection before Sentry.init
Uncaught error after Sentry.init
Sentry Test Error
```

Sentry received **only the two that happened after `init`**. The full item list:

```json
{"type":"session","status":"unhandled","errors":1,"init":true,"sid":"608c2fa0…"}
{"type":"event","exception":"Error: Uncaught error after Sentry.init","mechanism":"auto.browser.browserapierrors.setTimeout","handled":false,"transaction":"/late.html"}
{"type":"session","status":"unhandled","errors":1,"init":false,"sid":"608c2fa0…"}
{"type":"event","exception":"Error: Sentry Test Error (captureException)","mechanism":"generic","handled":true,"transaction":"/late.html"}
{"type":"event","exception":"Error: Sentry Test Error","mechanism":"auto.browser.global_handlers.onerror","handled":false,"transaction":"/late.html"}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"transaction":"/late.html"}
{"type":"span","items":["test Example Frontend Span","http.client GET localhost","test sentinel-span","browser.unload_event …","browser.dom_content_loaded_event …","browser.load_event …","browser.connect …","browser.cache …","browser.dns …","browser.request …","browser.response …","resource.script localhost","resource.script localhost","browser.paint first-paint","browser.paint first-contentful-paint","pageload Pageload"]}
{"type":"log","items":["info: hello from the browser quickstart"]}
```

- The pre-init uncaught error and the pre-init unhandled rejection are **lost**: no event, no
  breadcrumb, nothing. That is what `getting-started-config/javascript.mdx:7` warns about, and it is
  the whole reason `late-initialization.mdx` exists on the server side.
- The caught pre-init error is lost too, unsurprisingly (recorded in `window.__preInitCaught` as
  `"Error: Error before Sentry.init"` only).
- **Tracing survives late init.** The pageload span still ships with the full navigation-timing and
  resource children, because it is backdated to `performance.timeOrigin`. Logs, sessions, replay and
  propagation headers all behave as in the `npm` run.
- The very first session envelope is already `{"status":"unhandled","errors":1,"init":true}`: the
  session is created at init and the post-init uncaught error lands on it before the first flush, so
  there is no `status: "ok"` init session at all.

### Step 7 — Variant `cjs` (`results-cjs.json`)

`commonjs.mdx` is also a Node page (`:5-12`) and never renders for the browser platform, but the
entry it describes, `const Sentry = require("@sentry/browser")`, bundles and runs fine. The item set
is identical to the `npm` run: same 15 integrations, same `{"name":"npm:@sentry/browser","version":"10.67.0"}`
package, same events, same `pageload Pageload` segment, log item, replay envelope, navigation span,
and the propagation headers on `/recorder`.

The one measurable difference is bundle size, because `require` resolves the package's `main`
(`build/npm/cjs/prod/index.js`) which esbuild cannot tree-shake:

```
dist/app-npm.js  915.2kb     (ESM, resolves `module`)
dist/app-cjs.js  1.9mb ⚠️    (CJS, resolves `main`)
```

**Holds**, with that caveat.

### Step 8 — Lightweight mode: nothing to build

`lightweight.mdx` is a Node page (`:5-12`) and never renders for the browser platform. Against the
develop pin, every import and option it names is gone:

- No `sentry-node-core-10.67.0.tgz` in `_toolbox/pack-develop-03aaf424/` (43 tarballs, none is
  `node-core`). Migration `:1396`: "`@sentry/node-core` was merged back into `@sentry/node`."
- `@sentry/node@10.67.0` `exports`: `./package.json . ./import ./vite ./rollup ./webpack ./esbuild`.
  There is no `./light` and no `./light/otlp`, so neither `@sentry/node-core/light` (`:61`) nor
  `@sentry/node-core/light/otlp` (`:186`) resolves.
- `otlpIntegration` (`:158`, `:186`, `:201`, and the option table at `:208-211`) does not exist in
  `@sentry/node@10.67.0`; the type surface has `openTelemetryIntegration` instead, matching migration
  `:677`, which also says `setupOtlpTracesExporter` and `collectorUrl` were removed.
- `@sentry/browser@10.67.0` exports only `.` (plus `./package.json`), so there is no browser
  lightweight mode to look for either.

Nothing was built for this step. **Does not hold on develop.**

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/browser --save` is all you need (`getting-started-install/javascript.mdx:16`) | **yes** |
| The npm `Sentry.init` snippet initializes the SDK (`getting-started-config/javascript.mdx:14-57`) | **yes** — 15 integrations, `traceLifecycle: "stream"`, `attachStacktrace: true` |
| `tracePropagationTargets: ["localhost", …]` propagates the trace (`getting-started-config/javascript.mdx:46`) | **partial** — works on `localhost`, silently sends no `sentry-trace` / `baggage` on `127.0.0.1`, which is the other address a local dev server answers on |
| The errors-only verify button creates an issue (`getting-started-verify/javascript.mdx:22-30`) | **yes** — `mechanism: "auto.browser.global_handlers.onerror"`, `handled: false` |
| The tracing verify snippet throws an error and creates a trace (`getting-started-verify/javascript.mdx:45-68`) | **no** — the snippet is a `SyntaxError` (`await` in a non-`async` function), the script block never runs, `triggerError` is undefined |
| `Sentry.startSpan({ name: "Example Frontend Span", op: "test" })` produces a trace (same snippet, once fixed) | **partial** — the span exists, but as a child in a `span` envelope under the `pageload` segment; no `transaction` envelope is sent at all on develop's default `traceLifecycle: "stream"` |
| `Sentry.logger.info(...)` reaches Sentry (`includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13`) | **partial** — yes on npm, a silent no-op on `bundle.tracing.min.js` and `bundle.tracing.replay.min.js`; only the `*.logs.metrics` bundles carry logs, and nothing in the CDN section says so |
| The CDN tab's snippet gives you tracing and replay (`getting-started-config/javascript.mdx:114-164`) | **no** — the snippet loads `bundle.tracing.min.js` while adding `Sentry.replayIntegration()`; `Replay` shows up in the integration list, no `replayId` tag and no replay envelope is ever produced, and the only signal is a `console.warn` |
| `bundle.tracing.replay.min.js` is the Performance & Replay bundle (`loader.mdx:261-267`) | **yes** |
| `debug: true` produces debug messages (`loader.mdx:429`) | **partial** — on a `.min` bundle it warns "Cannot initialize SDK with `debug` option using a non-debug bundle"; on npm it logs, but never the SDK name or version |
| The `tunnel` option forwards events (`getting-started-tunneling/javascript.mdx:5`) | **yes** — every envelope in all six runs arrived through `/tunnel` |
| "head over to your project on Sentry.io to view the collected data" (`getting-started-complete/javascript.mdx:44`) | **partial** — what arrives is `span` envelopes named `Pageload` / `Navigation`, not the transactions the older wording implies; the raw URL is on `url.full` / `url.path` |
| Browser sessions use the `page` lifecycle, not renewed on navigation (migration `:854`) | **yes** — one `sid` across a `pushState` navigation, no new `init: true` session |
| Uncaught errors mark the session `unhandled` (migration `:853`) | **yes** |
| `captureMessage` attaches a synthetic stack trace (migration `:840`) | **yes** — `"synthetic": true` on the sentinel |
| CLS and LCP are dedicated spans in stream mode (migration `:926`) | **yes** — `ui.webvital.lcp`, `ui.webvital.cls`; INP not observed (no interaction latency in headless Chrome) |
| Replay is captured for 100% of sessions with an error (`getting-started-config/javascript.mdx:50-55`) | **partial** — a session shorter than `minReplayDuration` (5s) is discarded with "Session duration (0s) is too short, not sending replay", exactly the case a reader hits when they click the verify button right after load; the event still carries a `replayId` tag |
| Loader script behavior (`loader.mdx:47-239`) | **not run** — the loader is generated and served by Sentry per project; it cannot be pointed at a develop build. `Sentry.onLoad`/`forceLoad` shims do exist in the package; `window.sentryOnLoad` exists nowhere in the SDK |
| CommonJS `require("@sentry/browser")` (`commonjs.mdx:20-21`) | **yes** for the browser, with the caveat that the page's frontmatter excludes the browser platform, and that the CJS entry doubles the bundle (1.9 MB vs 915 KB) |
| Late initialization keeps auto-instrumentation (`late-initialization.mdx:20-22`) | **no** for the browser — the `@sentry/node/preload` hook it relies on has no browser counterpart and was removed from the server SDKs too (migration `:1359`); errors before `init` are lost, though the pageload span survives |
| Lightweight mode via `@sentry/node-core/light` (`lightweight.mdx:25-61`) | **no** — `@sentry/node-core` is not published on develop, `@sentry/node` has no `./light` export, and `otlpIntegration` is now `openTelemetryIntegration` |
| `esm.mdx` / `esm-without-import.mdx` apply to the browser guide | **no** — both are Node-only pages (`esm.mdx:5-12`, `esm-without-import.mdx:5-12`); neither describes an ESM CDN form, and no ESM CDN bundle is built (`bundles-develop-03aaf424/` holds four classic `<script>` bundles) |

## Files

`package.json`, `build.mjs` (esbuild, one bundle per variant), `src/app-npm.js`, `src/app-cjs.js`,
`src/app-late.js`, `public/index.html`, `public/cdn.html`, `public/cdn-tracing.html`,
`public/cjs.html`, `public/late.html`, `public/buttons.js` (the shared classic script that wires the
five buttons through `window.Sentry`), `public/docs-snippet.html` (the docs' tracing verify snippet
verbatim, no SDK), `drive.mjs` (the Playwright driver), `run.sh`, and `sink.mjs` — a copy of
`../../_toolbox/sink.mjs` extended with static file serving for `public/` and `dist/`, a `/vendor/`
mount over `../../_toolbox/bundles-develop-03aaf424/`, `Access-Control-Allow-Origin: *` plus `OPTIONS`
handling, a `/recorder` endpoint that records inbound propagation headers, `/__headers`, a `/dsn`
endpoint for the late-init variant, and compact mappings for `session`, `replay_event`,
`replay_recording` and `client_report` items.

`node_modules/` and `dist/` were removed after the run; the Install and Run sections restore them.
