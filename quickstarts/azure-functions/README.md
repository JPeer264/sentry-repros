# QS-azure-functions, Azure Functions getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
No Azure account, Core Tools or host: the guide's function files are loaded and invoked by a small runner
(`invoke.mjs`) that plays the host, with a fake v3 `(context, req)` pair (the shape the guide uses) or the
`@azure/functions` `4.16.2` `HttpRequest` / `InvocationContext` classes from the registry (the guide names no
`@azure/functions` major and never imports the package). All envelopes go to a local sink via the `tunnel`
option; nothing leaves the machine. No profiling variant was run (the `profiling` onboarding option needs the
native `@sentry/profiling-node` binary).

The Node.js run in `../node/README.md` and the Express run in `../express/README.md` cover the plain-Node
findings. The only one that applies here is the missing-release session warning (`Sentry Logger [warn]:
Discarded session because of missing or non-string release`, once per captured event, because the config
snippet sets no `release`); the `--require` banner, the removed `@sentry/node/preload` entry and the
extensionless ESM import do not apply, this guide has no `instrument.js` and every snippet is CommonJS.

## What it reproduces

A new user following the Azure Functions guide end to end: install `@sentry/node`, put the config snippet at the
top of the function file, then the Capture Errors snippet and the two verify snippets (Issues and Tracing), plus
the Logs verify section the page renders. Every snippet is one CommonJS file (`function-*.js`) that is the docs
text verbatim plus `tunnel` and `debug: true` (marked repro-only). The runner requires the file, invokes the
exported handler once (`GET http://localhost:7071/api/verify?name=sentry`, headers `host`, `user-agent`,
`accept`, `x-forwarded-for: 203.0.113.7`), snapshots the sink right after the handler returns (so only the
guide's own `await Sentry.flush(2000)` can have delivered anything by then), and then captures a sentinel
message and a sentinel span through the same client, flushes and polls the sink for both (hard deadline 60 s,
no fixed sleeps).

| Variant | File | Snippet | Model |
| --- | --- | --- | --- |
| `verify` | `function-verify.js` | `index.mdx:55,60-61,69-74,83` (Configure, `error-monitoring` + `performance`) and `:154-172` (Verify > Issues) | v3 `(context, req)` |
| `errors-only` | `function-verify-errors-only.js` | same without `tracesSampleRate` (`error-monitoring` only) | v3 |
| `tracing` | `function-tracing.js` | Configure with `tracesSampleRate` and `:193-206` (Verify > Tracing) | v3 |
| `capture-errors` | `function-capture-errors.js` | Configure and `:108-121` (Capture Errors), verbatim: the `try` body is the placeholder comment | v3 |
| `logs` | `function-logs.js` | Configure and `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-23`, the three logger calls inside a function of the guide's shape (`:154`, `:166-171`) | v3 |
| `normalized-request` | `function-verify-normalized.js` | repro-only: `:154-172` with `{ request: req }` (`:160`) replaced by `{ normalizedRequest: {...} }` | v3 |
| `v4-model` | `function-v4.js` | repro-only: the `:154-172` body on `@azure/functions` v4 `app.http` (`(request, context)` handler, returned response), which the guide does not show | v4 |

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.azure-functions`), then
`fallbackGuide` (none in `guides/azure-functions/index.mdx:1-10`), then platform (`javascript`), then
`_default`. One include has a `javascript.azure-functions.mdx`: `getting-started-install`. The frontmatter
(`index.mdx:4`) declares `sdk: sentry.javascript.astro`.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/azure-functions/index.mdx:12` prerequisites | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` ("Your application up and running", no Node version, no programming model, no runner) |
| `index.mdx:20-22` onboarding options | inline: `error-monitoring`, `performance`, `profiling` (no `logs`) |
| `index.mdx:24` features expandable | `includes/quick-start-features-expandable.mdx:29-36` (`javascript.azure-functions` listed in the server row: issues, tracing, profiling, logs) |
| `index.mdx:37` install | `platform-includes/getting-started-install/javascript.azure-functions.mdx:3-13` (`@sentry/node`), `:19-29` with `@sentry/profiling-node` under `profiling` |
| `index.mdx:54-86` config | inline: `const Sentry = require("@sentry/node")`, `Sentry.init({ dsn, tracesSampleRate: 1.0 })`, "your function code" |
| `index.mdx:98`, `:103-122` capture errors | inline: `module.exports = async function (context, req)`, `Sentry.withScope` + `scope.setSDKProcessingMetadata({ request: req })` + `Sentry.captureException(e)`, `await Sentry.flush(2000)` |
| `index.mdx:130`, `:134` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx:5-24` (`dataCollection: { userInfo: false }`; not run) |
| `index.mdx:151-173` verify issues | inline: `await notExistFunction()` in `try`, same `withScope` block, `await Sentry.flush(2000)`, `context.res = { status: 500, ... }` |
| `index.mdx:179-213` verify tracing (`performance` option) | inline: `Sentry.startSpan({ name: "My Custom Span", op: "task" }, ...)`, `await Sentry.flush(2000)`, `context.res = { status: 200, ... }` |
| `index.mdx:215-219` verify logs (`logs` option) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24`; the page's buttons (`:20-22`) offer no `logs` option, and `src/components/onboarding/index.tsx:196-215` only toggles the options a page offers, so this section is not hidden by the option logic (read from the code, the site was not rendered here) |
| `index.mdx:225` locate data | `includes/quick-start-locate-data-expandable.mdx:29-36` |
| ContextLines integration page | `guides/azure-functions/configuration/integrations/contextlines.mdx:1-20` -> `platform-includes/configuration/contextlines` |
| Automatic instrumentation page | `guides/azure-functions/tracing/instrumentation/automatic-instrumentation.mdx:3,7` ("Learn what transactions are captured ... in the Sentry Azure Functions SDK") -> `includes/node-automatic-instrumentation.mdx:1-4` ("Incoming requests", "Outgoing HTTP requests", databases) |

## Install

```bash
cd $REPRO/quickstarts/azure-functions
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus @azure/functions@4
```

## Run

```bash
cd $REPRO/quickstarts/azure-functions
./run.sh verify              # function-verify.js, v3 handler, tracing on          -> results-verify.json
./run.sh errors-only         # function-verify-errors-only.js, no tracesSampleRate -> results-errors-only.json
./run.sh tracing             # function-tracing.js                                 -> results-tracing.json
./run.sh capture-errors      # function-capture-errors.js (placeholder try body)   -> results-capture-errors.json
./run.sh logs                # function-logs.js                                    -> results-logs.json
./run.sh normalized-request  # function-verify-normalized.js (repro-only key)      -> results-normalized-request.json
./run.sh v4-model            # function-v4.js, @azure/functions v4 app.http        -> results-v4-model.json
```

Each run starts the sink on `127.0.0.1:4745` (checked free first), runs
`node invoke.mjs <variant> <file> <v3|v4> verify` in the foreground (capped at 120 s), writes
`results-<variant>.json` (runner steps with the handler's response, the console output with the installed
integrations, the compact sink items, the raw error events and span payloads, a computed verdict) via
`summarize.mjs`, and kills the sink. Machine paths are replaced by `$REPRO`. For `v4-model` the runner replaces
`app.http` before requiring the file, so the `@azure/functions` "test mode" registration skip never runs and the
registered handler is invoked with `new HttpRequest(...)` and `new InvocationContext(...)`.

## Expected (what the guide claims)

- `getting-started-install/javascript.azure-functions.mdx:3-5`: `npm install @sentry/node --save`.
- `index.mdx:49`: "initialize Sentry at the top of your function file before importing any other modules".
- `index.mdx:70`: "Set tracesSampleRate to 1.0 to capture 100% of transactions".
- `index.mdx:98`: "you have to explicitly `flush` Sentry events after calling `captureException`, or they may be lost".
- `index.mdx:112-115`: "use Sentry.withScope to enrich the event with request data", "Attach request context (requires dataCollection: { userInfo: true })", `scope.setSDKProcessingMetadata({ request: req })`.
- `index.mdx:146,154-172`: the `notExistFunction()` snippet "captures errors and creates issues"; `:165-166` "Wait for the event to be sent before the function execution ends".
- `index.mdx:185,193-206`: "To test tracing, update your function to include a custom span" `My Custom Span`, op `task`.
- `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:6,13-23`: "To verify that Sentry catches your logs, add some log statements"; the guide's init has no logs option.
- `getting-started-data-collection/javascript.mdx:5`: "By default, the SDK sends user identity data (IP address, ID, and similar) and other data like HTTP bodies and URL query parameters."
- `automatic-instrumentation.mdx:3` + `includes/node-automatic-instrumentation.mdx:1-3`: transactions/spans are captured for "Incoming requests".

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `@azure/functions@4` succeeded (`added 62 packages in 3s`).
`node_modules/@sentry` holds `bundler-plugins conventions core node opentelemetry server-runtime-injection
server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*` entry except
`@sentry/conventions@0.20.0` (a normal published dependency). `@azure/functions` is `4.16.2`. **Holds.**

Exports the snippets use, checked in `node_modules/@sentry/node/build/types/index.d.ts:10,15,19` and the core
`.d.ts` files they re-export:

| Export | Status on develop |
| --- | --- |
| `init`, `withScope`, `captureException`, `flush`, `startSpan`, `captureMessage` | exist, no `@deprecated` |
| `Sentry.logger.info/warn/error` | exist (`index.d.ts:19`, `export * as logger`) |
| `scope.setSDKProcessingMetadata(newData)` | exists, no `@deprecated` (`core/build/types/scope.d.ts:315-319`); the `SdkProcessingMetadata` type (`scope.d.ts:38-48`) has `normalizedRequest?: RequestEventData` and an index signature, so `{ request: req }` type-checks and is ignored |
| `dataCollection.userInfo` (`index.mdx:114`) | exists, `@default true` (`core/build/types/types/datacollection.d.ts:20-25`); it controls `user.*` fields, not `event.request` |
| `enableLogs` | no longer exists (not in `options.d.ts`; `migration/v10-to-v11/index.mdx:816`); the guide does not use it |
| `@sentry/profiling-node`, `nodeProfilingIntegration` (`index.mdx:57,65`) | not run |

### Step 2, Configure

`debug: true` prints no SDK name or version; identity was read off the envelopes: `sentry.javascript.node`
`10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** with `tracesSampleRate: 1.0`, the same list
as the Koa and GCP runs (`EventFilters ... Http NodeFetch ... Express Fastify Hapi Koa ... SpanStreaming`); **23**
with the `error-monitoring` option only (`errors-only`). There is no Azure- or FaaS-specific integration in
either list. Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`,
`Initializing Sentry: process: <pid>, thread: main.`, `SDK initialized from CommonJS`, `[Sentry] Runtime hook
registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per captured event `Sentry
Logger [warn]: Discarded session because of missing or non-string release` (`../node/README.md`). No deprecation
notice in any variant (`deprecation_output: []`).

### Step 3, Capture Errors and Verify > Issues (`verify`, `errors-only`)

The guide's own `await Sentry.flush(2000)` delivers the event: the sink held exactly one `event` item right
after the handler returned (`sink_after_function: {"event": 1}`) in `verify`, `errors-only` and `v4-model`, and
`context.res` was `{ status: 500, body: "Test error sent to Sentry." }`. The event:

```json
{"exception":"ReferenceError: notExistFunction is not defined","mechanism":{"type":"generic","handled":true},
 "server_name":"<hostname>","environment":"production",
 "contexts":{"runtime":{"name":"node","version":"v26.5.0"},"cloud_resource":{},"trace":{"trace_id":"...","span_id":"..."}}}
```

**No `request`, no `user`, no `transaction`** on the event, with tracing on or off. `scope.setSDKProcessingMetadata({
request: req })` (`index.mdx:115`, `:160`) attaches nothing: the `RequestData` integration reads only
`sdkProcessingMetadata.normalizedRequest` (`packages/core/src/integrations/requestdata.ts:83-91`) and no code in
`@sentry/core`, `@sentry/node` or `@sentry/server-utils` reads a `request` key. `normalized-request`, the same
file with `{ normalizedRequest: { url: req.url, method: req.method, headers: req.headers, query_string, data:
req.body } }`, gives `request: { url: "http://localhost:7071/api/verify?name=sentry", method: "GET", headers:
{...}, cookies: {}, query_string: "name=sentry" }` and `user: { ip_address: "203.0.113.7" }` (from
`x-forwarded-for`) with the default `dataCollection` (`results-normalized-request.json`). So the comment
"requires dataCollection: { userInfo: true }" (`index.mdx:114`) describes the default and the wrong field: the
IP lands in `user`, and `event.request` needs the `normalizedRequest` key, not a data-collection option.

The trace context on the error event is a fresh `trace_id`/`span_id` with no parent: nothing instruments the
invocation, so there is no active span, no `transaction` name (the issue is not tagged with the function name),
and no `faas.*` or `cloud.*` attribute anywhere (`faas_cloud_attributes` holds only the empty
`contexts.cloud_resource: {}` the `Context` integration adds). `capture-errors` (`index.mdx:108-121` verbatim)
runs, sends nothing (the `try` body is the placeholder comment) and sets no `context.res`; the sink stayed empty
until the sentinel (`results-capture-errors.json`).

### Step 4, Verify > Tracing (`tracing`)

`My Custom Span` (op `task`, `origin: manual`, status `ok`) arrives inside a **`span` envelope** as its own
segment (`is_segment: true`, `sentry.segment.name: My Custom Span`, `sentry.segment.name.source: custom`,
`sentry.trace_lifecycle: stream`), delivered by the guide's flush (`sink_after_function: {"span": 1}`); the
sentinel span is a second segment. **No `transaction` envelope was sent in any variant**, and no automatic span
wraps the invocation: the custom span has no parent, so the "Incoming requests" line of
`includes/node-automatic-instrumentation.mdx:3` does not apply to the function itself here (the host's HTTP
handling never goes through Node's `http` server in this code path; the real host was not run). The page text
("capture 100% of transactions", `index.mdx:70`; "what transactions are captured", `automatic-instrumentation.mdx:3`)
does not match what arrives. `results-tracing.json`.

### Step 5, Logs (`logs`)

With the guide's init as-is (no logs option, none exists on develop) the three logger calls produce one `log`
envelope with `info: User example action completed`, `warn: Slow operation detected`, `error: Validation
failed`, delivered by the guide's flush (`sink_after_function: {"log": 1}`). The section the page renders for it
sits under `<OnboardingOption optionId="logs">` (`index.mdx:215`) although the buttons (`:20-22`) offer no
`logs`. `results-logs.json`.

### Step 6, `@azure/functions` v4 (`v4-model`, repro-only)

The guide only shows the v3 shape (`module.exports = async function (context, req)`, `context.res`, `:108`,
`:154`, `:168-171`, `:193`, `:202-205`) and never mentions `@azure/functions` or `app.http`. The same
`withScope` + `captureException` + `flush` body inside an `app.http("verify", { handler: async (request,
context) => ... })` registration works the same way (`ReferenceError` event delivered by the flush, `{ status:
500, body }` returned), and `scope.setSDKProcessingMetadata({ request })` with the v4 `HttpRequest` attaches
nothing either. `results-v4-model.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` (`getting-started-install/javascript.azure-functions.mdx:3-5`) | **yes** |
| Init at the top of the function file (`index.mdx:49,55-83`) | **yes**, 46 integrations (23 without `tracesSampleRate`) |
| Explicit `flush` after `captureException` delivers the event (`index.mdx:98,118,166`) | **yes**, the event, the custom span and the log batch were each in the sink before the handler returned |
| `withScope` + `setSDKProcessingMetadata({ request: req })` enriches the event with request data (`index.mdx:112-115,160`) | **no**, no `request`, no `user` on the event; the build reads `normalizedRequest` (`requestdata.ts:83-91`), and with that key request data and `user.ip_address` appear |
| "requires dataCollection: { userInfo: true }" (`index.mdx:114`) | **no**, `userInfo` is `true` by default and governs `user.*`; `event.request` does not depend on it |
| Verify snippet creates an issue (`index.mdx:146,154-172`) | **yes**, `ReferenceError: notExistFunction is not defined`, `mechanism: generic`, `handled: true`, no `transaction` |
| Custom span verifies tracing (`index.mdx:185,193-206`) | **yes** as a root segment in a `span` envelope; "100% of transactions" (`:70`) and "what transactions are captured" (`automatic-instrumentation.mdx:3`) describe an item type that never arrives |
| "Incoming requests" are captured automatically (`includes/node-automatic-instrumentation.mdx:3`) | **not in this code path**: no automatic span, no `faas.*`/`cloud.*` attributes, no `transaction` name on events; the real host was not run |
| Logs verify snippet (`javascript-quick-start-verify-logs-splitlayout.mdx:13-23`) | **yes**, with no extra option |
| `sdk: sentry.javascript.astro` (`index.mdx:4`) | the "Package Details" box (`src/components/platformSdkDetail/index.tsx:16-56`) takes the SDK name from this frontmatter, so it would show the Astro package; read from the code, the site was not rendered here |
| v4 programming model | **not documented**; the guide's body works on `app.http` too (`v4-model`) |

## Files

`package.json`, `function-verify.js`, `function-verify-errors-only.js`, `function-tracing.js`,
`function-capture-errors.js`, `function-logs.js`, `function-verify-normalized.js`, `function-v4.js`,
`invoke.mjs`, `summarize.mjs`, `run.sh`, `sink.mjs` (a copy of `../koa/sink.mjs`), `results-<variant>.json`,
`app-<variant>.log`, `sink-<variant>.log`.
