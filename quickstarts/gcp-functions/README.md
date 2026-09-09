# QS-gcp-functions, Google Cloud Functions getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
The function is served locally with `@google-cloud/functions-framework` `4.0.0` from the registry (the guide
names no local runner or deploy step; the Functions Framework is what Cloud Functions runs in production and the
only way to invoke the snippets without a Google Cloud account). All envelopes go to a local sink via the
`tunnel` option; nothing leaves the machine. No profiling variant was run (the `profiling` onboarding option
needs the native `@sentry/profiling-node` binary).

The Node.js run in `../node/README.md` and the Express run in `../express/README.md` cover the plain-Node
findings. The only one that applies here is the missing-release session warning (`Sentry Logger [warn]:
Discarded session because of missing or non-string release`, once per captured event, because the config
snippet sets no `release`); the `--require` banner, the removed `@sentry/node/preload` entry and the
extensionless ESM import do not apply, this guide has no `instrument.js` and every snippet is CommonJS.

## What it reproduces

A new user following the Google Cloud Functions guide end to end: install `@sentry/google-cloud-serverless`,
paste the config snippet for the kind of function (HTTP, Background, CloudEvent), then the verify snippets
(Issues and Tracing) for the same three kinds, and the init snippet of the automatic instrumentation page.
Every snippet is one CommonJS file (`function-*.js`) that is the docs text verbatim plus `tunnel`, `debug: true`
and a repro-only `SIGUSR2` handler at the bottom which captures a sentinel message, a sentinel span and a log
line through the same client and flushes. Each variant serves one file with
`node node_modules/@google-cloud/functions-framework/build/src/main.js --target=<export> --signature-type=<http|event|cloudevent> --source=./<file> --port=4744`.

| Variant | File | Snippet | Request |
| --- | --- | --- | --- |
| `http-config` | `function-http.js` | `getting-started-config/javascript.gcp-functions.mdx:1-37` (Http tab, `performance` option) | `GET /`, `GET /some/path?x=1` (the second with `sentry-trace`/`baggage` headers) |
| `http-config-env` | same file | same, with `FUNCTION_TARGET=helloHttp K_SERVICE=helloHttp` in the environment as Cloud Run sets them | same |
| `http-errors-only` | `function-http-errors-only.js` | same snippet with only the `error-monitoring` option (no `tracesSampleRate`) | same |
| `http-verify` | `function-http-verify.js` | `guides/gcp-functions/index.mdx:96-98` (Verify > Issues, Http tab) | same |
| `http-tracing` | `function-http-tracing.js` | `guides/gcp-functions/index.mdx:131-141` (Verify > Tracing, Http tab) | same |
| `event-config` | `function-event.js` | `getting-started-config/javascript.gcp-functions.mdx:39-76` (Background tab, `wrapEventFunction`) | `POST /` with a legacy `{context, data}` Pub/Sub body |
| `event-verify` | `function-event-verify.js` | `guides/gcp-functions/index.mdx:102-106` (Verify > Issues, Background tab, `wrapBackgroundFunction`) | same |
| `event-tracing-verbatim` | `function-event-tracing-verbatim.js` | `guides/gcp-functions/index.mdx:145-155` (Verify > Tracing, Background tab, `wrapBackgroundFunction`) | same |
| `event-tracing` | `function-event-tracing.js` | `:145-155` with `wrapEventFunction` in place of the non-existent export (repro-only rename) | same |
| `cloudevent-config` | `function-cloudevent.js` | `getting-started-config/javascript.gcp-functions.mdx:78-115` (CloudEvent tab) | `POST /` with `content-type: application/cloudevents+json` |
| `cloudevent-verify` | `function-cloudevent-verify.js` | `guides/gcp-functions/index.mdx:110-112` (Verify > Issues, CloudEvent tab) | same |
| `cloudevent-tracing` | `function-cloudevent-tracing.js` | `guides/gcp-functions/index.mdx:159-167` (Verify > Tracing, CloudEvent tab) | same |
| `auto-instrumentation` | `function-auto-instrumentation.js` | `guides/gcp-functions/tracing/instrumentation/automatic-instrumentation.mdx:23-37` plus the config Http export | `GET /` |

The readiness probe hits `/robots.txt`, which the framework answers itself (404) without invoking the function.

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.gcp-functions`), then
`fallbackGuide` (`javascript.node`, from `guides/gcp-functions/index.mdx:5`), then platform (`javascript`),
then `_default`. Three includes have a `javascript.gcp-functions.mdx`: `getting-started-prerequisites`,
`getting-started-install` and `getting-started-config`.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/gcp-functions/index.mdx:24` prerequisites | `platform-includes/getting-started-prerequisites/javascript.gcp-functions.mdx:1-6` ("Your application up and running", no Node version, no runner) |
| `index.mdx:32-34` onboarding options | inline: `error-monitoring`, `performance`, `profiling` (no `logs`) |
| `index.mdx:36` features expandable | `includes/quick-start-features-expandable.mdx:29` (`javascript.gcp-functions` listed in the server row) |
| `index.mdx:49` install | `platform-includes/getting-started-install/javascript.gcp-functions.mdx:3-13` (`@sentry/google-cloud-serverless`), `:19-29` with `@sentry/profiling-node` under `profiling` |
| `index.mdx:66` config | `platform-includes/getting-started-config/javascript.gcp-functions.mdx:1-37` (Http), `:39-76` (Background, `wrapEventFunction`), `:78-115` (CloudEvent) |
| `index.mdx:74`, `:78` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `index.mdx:95-113` verify issues | inline: `wrapHttpFunction` `:96-98`, `wrapBackgroundFunction` `:102-106`, `wrapCloudEventFunction` `:110-112` |
| `index.mdx:130-168` verify tracing (`performance` option) | inline: `:131-141`, `:145-155` (`wrapBackgroundFunction`), `:159-167` |
| `index.mdx:176-180` verify logs | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24`, only under a `logs` onboarding option that `index.mdx:32-34` does not offer, so it never renders |
| `index.mdx:186` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| Automatic instrumentation page | `guides/gcp-functions/tracing/instrumentation/automatic-instrumentation.mdx:1-38` (no includes) |
| ContextLines page | `guides/gcp-functions/configuration/integrations/contextlines.mdx:12` -> `platform-includes/configuration/contextlines/` (not run) |

## Install

```bash
cd $REPRO/quickstarts/gcp-functions
npm install            # package.json pins the seven develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus @google-cloud/functions-framework@4
```

## Run

```bash
cd $REPRO/quickstarts/gcp-functions
./run.sh http-config             # -> results-http-config.json
./run.sh http-config-env         # FUNCTION_TARGET/K_SERVICE set     -> results-http-config-env.json
./run.sh http-errors-only        # no tracesSampleRate                -> results-http-errors-only.json
./run.sh http-verify             # -> results-http-verify.json
./run.sh http-tracing            # -> results-http-tracing.json
./run.sh event-config            # --signature-type=event             -> results-event-config.json
./run.sh event-verify            # wrapBackgroundFunction             -> results-event-verify.json
./run.sh event-tracing-verbatim  # wrapBackgroundFunction             -> results-event-tracing-verbatim.json
./run.sh event-tracing           # wrapEventFunction (rename)         -> results-event-tracing.json
./run.sh cloudevent-config       # --signature-type=cloudevent        -> results-cloudevent-config.json
./run.sh cloudevent-verify       # -> results-cloudevent-verify.json
./run.sh cloudevent-tracing      # -> results-cloudevent-tracing.json
./run.sh auto-instrumentation    # automatic-instrumentation.mdx init -> results-auto-instrumentation.json
```

Each run starts the sink on `127.0.0.1:4743` and the Functions Framework on `127.0.0.1:4744` (both checked
free first), sends the requests of the table above, sends `SIGUSR2` to the function process (the sentinel),
polls `/__items` until the sentinel event, the sentinel segment (skipped for `http-errors-only`, which sends no
spans) and the log batch have all arrived (hard deadline 60 s, no fixed sleeps), writes `results-<variant>.json`
(steps with HTTP codes and bodies, console output with the installed integrations, the compact sink items with
every span attribute, the raw span payloads and a computed verdict) via `summarize.mjs`, and kills both
processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.gcp-functions.mdx:3-5`: `npm install @sentry/google-cloud-serverless --save`.
- `index.mdx:61`: "initialize Sentry at the top of your function code and wrap each function with the appropriate helper".
- `getting-started-config/javascript.gcp-functions.mdx:34-36`, `:71-75`, `:110-114`: `Sentry.wrapHttpFunction`, `Sentry.wrapEventFunction`, `Sentry.wrapCloudEventFunction` around a handler that throws `oh, hello there!`; `:19` "Set tracesSampleRate to 1.0 to capture 100% of transactions".
- `index.mdx:90-113`: "Add an intentional error in your function", `Sentry.wrapHttpFunction`, `Sentry.wrapBackgroundFunction`, `Sentry.wrapCloudEventFunction`.
- `index.mdx:125-168`: "To test tracing, wrap your code in a span", `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` inside each wrapper, `res.status(200).send("Success!")` for HTTP.
- `index.mdx:184`: "head over to your project on Sentry.io to view the collected data".
- `automatic-instrumentation.mdx:3,7`: "Learn what transactions are captured", "the Sentry SDK will automatically capture spans for incoming, and outgoing HTTP requests"; `:9-18` database instrumentation "can be manually enabled by adding the corresponding integration", `:22-37` `Sentry.mysqlIntegration()`, `mysql2Integration()`, `pgIntegration()`, `graphqlIntegration()`, `mongoIntegration()`, `mongooseIntegration()`, `ioredisIntegration()`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the seven develop tarballs plus `@google-cloud/functions-framework@4` succeeded (`added 201
packages in 15s`; npm warns that its `cloudevents@8.0.3` dependency wants Node `<=22`). `node_modules/@sentry`
holds `bundler-plugins conventions core google-cloud-serverless node opentelemetry server-runtime-injection
server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*` entry except
`@sentry/conventions@0.20.0` (a normal published dependency). `@types/express` is a peer dependency of the SDK
package and npm installed it. **Holds.**

The tarball ships `build/cjs`, `build/esm` and `build/types` (64 `package/build/` entries). Its `exports` map is
`.`, `./import` and `./package.json`; the guide only imports the root, so no missing subpath. Exports the
snippets use, checked in `node_modules/@sentry/google-cloud-serverless/build/types/index.d.ts` and
`build/types/gcpfunction/*.d.ts`:

| Export | Status on develop |
| --- | --- |
| `wrapHttpFunction(fn, { flushTimeout? })` | exists (`gcpfunction/http.d.ts`), not deprecated |
| `wrapEventFunction(fn, { flushTimeout? })` | exists (`gcpfunction/events.d.ts`), not deprecated |
| `wrapCloudEventFunction(fn, { flushTimeout? })` | exists (`gcpfunction/cloud_events.d.ts`), not deprecated |
| `wrapBackgroundFunction` (`index.mdx:102,145`) | **does not exist**; the package has never had it, the Background helper is `wrapEventFunction` |
| `mysqlIntegration`, `mysql2Integration`, `graphqlIntegration`, `mongoIntegration`, `mongooseIntegration` | exist (re-exported from `@sentry/node`) |
| `pgIntegration` (`automatic-instrumentation.mdx:31`) | **does not exist**; the export is `postgresIntegration` |
| `ioredisIntegration` (`automatic-instrumentation.mdx:35`) | **does not exist**; the export is `redisIntegration` |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger.info`, `Sentry.flush` | exist |
| `nodeProfilingIntegration` from `@sentry/profiling-node` | not installed, not run |

### Step 2, Configure and run (`http-config`, `results-http-config.json`)

`debug: true` prints no SDK name or version; identity was read off the envelopes:
`sentry.javascript.google-cloud-serverless` `10.67.0`, runtime `node` `v26.5.0`. **26 integrations installed**,
the same with and without `tracesSampleRate` (the package's `init` uses `getDefaultIntegrationsWithoutPerformance()`
plus `GcpContext`, so no database or `Prisma`/`Graphql`/`Mongo` integration is on by default; `Express`, `Fastify`,
`Hapi` and `Koa` are, as part of the base set):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa GcpContext GoogleCloudHttp GoogleCloudGrpc SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `SDK initialized from CommonJS`, `[Sentry] Runtime hook registered,
injected libraries=[]`, `[Sentry] Bundler plugin did not run`, then the framework's `Serving function... /
Function: helloHttp / Signature type: http / URL: http://localhost:4744/`. Per captured error: `Captured error
event`, the stack, `Discarded session because of missing or non-string release` (twice for the first request)
and `Recorded request session with status: errored`. No deprecation output in any variant.

`GET /` answers HTTP 500 with the body `oh, hello there!` in 20 ms (the framework's Express error handler).
Error event:

```json
{"type":"event","exception":"Error: oh, hello there!","mechanism":"auto.function.serverless.gcp_http","handled":false,
 "level":"error","sdk":"sentry.javascript.google-cloud-serverless","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /",
 "request":{"url":"http://127.0.0.1:4744/","method":"GET","hasData":true,"headers":{"host":"127.0.0.1:4744","user-agent":"curl/8.7.1","accept":"*/*"}},
 "user":{"ip_address":"::ffff:127.0.0.1"},"environment":"production",
 "context_keys":["trace","runtime","app","os","device","culture","cloud_resource"],"cloud_resource":{}}
```

`transaction` is the raw `GET /some/path` for the second request (URL, not route). The `cloud_resource` context
is present but empty; no `cloud.*` attribute exists on any span.

Spans: **two segments per HTTP invocation, in two different traces**, no `transaction` envelope anywhere
(`sentry.trace_lifecycle: stream` on every span):

```
Serverless function execution  [op=function.gcp  origin=auto.function.serverless.gcp_http  source=component  status=error 500  trace=75a6dc4f…]
GET                            [op=http.server   origin=auto.http.http_server              source=url        status=error 500  trace=bf27efef…]
```

The `function.gcp` segment carries `faas.trigger: http`, `http.request.method: GET`, `url.path: /`
(`url.query: x=1` for the second request), `url.full`, the request headers and `http.response.status_code`,
but **no `faas.name`**: `getFunctionName()` reads only `FUNCTION_TARGET` or `K_SERVICE` from the environment, and
`functions-framework --target=helloHttp` does not export either, so locally the segment gets the fallback name
`Serverless function execution`. With `FUNCTION_TARGET=helloHttp K_SERVICE=helloHttp` in the environment
(`http-config-env`, how Cloud Run sets them) the segment is `helloHttp` with `faas.name: helloHttp`; everything
else is identical. The `http.server` segment is the Node http instrumentation's own root span for the same
request (`GET`, `source=url`, `server.address`, `server.port`). `wrapHttpFunction` calls `continueTrace` with the
incoming headers before `startSpanManual`; without a `sentry-trace` header that starts a fresh trace, so the
function span and the error event (trace `75a6dc4f…`) are not connected to the `http.server` segment (trace
`bf27efef…`). With the `sentry-trace`/`baggage` headers of the second request both segments share the trace
`12345678901234567890123456789012` but are siblings (both `parent_span_id: 1234567890123456`, both
`is_segment: true`), not nested. The Event and CloudEvent wrappers do not call `continueTrace`, and there the
`function.gcp` span is a child of the `http.server` `POST` segment (see Step 4).

Sentinel: `captureMessage` event (`mechanism: generic`, `handled: true`), a `sentinel` segment (`op: test`,
`source=custom`) and one `log` item `info: User example action completed`. Logs arrive with the guide's config
(nothing enables them), although the page never shows the logs verify step.

### Step 3, Verify (HTTP): both snippets work

`http-verify` (`index.mdx:96-98`): HTTP 500, `Error: Sentry Test Error - This is intentional!`,
`mechanism: auto.function.serverless.gcp_http`, `handled: false`, `transaction: GET /`, request data present,
plus the same two segments per request. `results-http-verify.json`.

`http-tracing` (`index.mdx:131-141`): HTTP 200 `Success!` after ~110 ms, no error event, the two segments per
request with `status: ok` and a `test` child span `My First Test Transaction` (`origin: manual`,
`segment_name: Serverless function execution`) inside a `span` envelope. The span is named "My First Test
Transaction" but no transaction exists anywhere in the sink; the page text ("wrap your code in a span") is right,
the config comment ("capture 100% of transactions") and the automatic instrumentation page ("what transactions
are captured") are not. `results-http-tracing.json`.

### Step 4, Background and CloudEvent functions

- **`event-verify`** and **`event-tracing-verbatim`** (`index.mdx:102-106`, `:145-155`): the function does not
  load. The framework prints `Provided module can't be loaded. / Is there a syntax error in your code? /
  Detailed stack trace: TypeError: Sentry.wrapBackgroundFunction is not a function / Could not load the function,
  shutting down.` and exits after `Sentry.init` (26 integrations installed, nothing captured). The config step
  two headings earlier uses `Sentry.wrapEventFunction` for the same tab. `results-event-verify.json`,
  `results-event-tracing-verbatim.json`.
- **`event-config`** (`getting-started-config/javascript.gcp-functions.mdx:71-75`, `(data, context, callback)`
  that throws): HTTP 500 `oh, hello there!`, error event `mechanism: auto.function.serverless.gcp_event`,
  `handled: false`, `transaction: POST /`, with a `gcp.function.context` context holding the legacy
  `eventId`, `timestamp`, `eventType`, `resource`. **No `function.gcp` span arrives**: the sink holds only the
  framework's `http.server` `POST` segment (`status: error`) and the sentinel. The wrapper picks the
  callback path for a three-parameter handler; a synchronous throw is captured by `handleCallbackErrors` and
  rethrown, the callback that ends the span and flushes is never called, so the span is never ended.
  `results-event-config.json`.
- **`event-tracing`** (`:145-155` with `wrapEventFunction`, the repro-only rename): HTTP 204, no error event, one
  `POST` segment with two children: `Serverless function execution` (`op: function.gcp`,
  `origin: auto.function.serverless.gcp_event`, `faas.trigger: event`, `gcp.function.context.event_type`,
  `.event_id`, `.resource`, `.timestamp` attributes, no `faas.name`) and its child `My First Test Transaction`
  (`op: test`). The `GcpContext` integration's `processSegmentSpan` put nothing on the `POST` segment (its
  `gcp: {}` in the results), the `gcp.function.context.*` attributes sit on the wrapper span. `results-event-tracing.json`.
- **`cloudevent-config`** and **`cloudevent-verify`** (`:110-114`, `index.mdx:110-112`, `(context, callback)`
  that throws): HTTP 500, error event `mechanism: auto.function.serverless.gcp_cloud_event`, `handled: false`,
  `transaction: POST /`, `gcp.function.context` context with `specversion`, `type`, `source`, `id`, `time`,
  `data`; again **no `function.gcp` span** (same callback path). `results-cloudevent-config.json`,
  `results-cloudevent-verify.json`.
- **`cloudevent-tracing`** (`index.mdx:159-167`): HTTP 204, `POST` segment with the `function.gcp` child
  (`faas.trigger: cloud_event`, `gcp.function.context.type/id/source/specversion/time`) and the `test` child.
  `results-cloudevent-tracing.json`.

### Step 5, Automatic instrumentation page (`auto-instrumentation`)

`automatic-instrumentation.mdx:23-37` verbatim: the function does not load, `TypeError: Sentry.pgIntegration is
not a function` (evaluated while building the `integrations` array, before `Sentry.init` runs; nothing is
initialized). `Sentry.ioredisIntegration` two lines later does not exist either. The page's other claim, that
database instrumentation is opt-in for this package, matches the build (no database integration among the 26
defaults). Incoming HTTP requests are captured (`http.server` segments above); outgoing requests were not
exercised. `results-auto-instrumentation.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/google-cloud-serverless` (`getting-started-install/javascript.gcp-functions.mdx:3-5`) | **yes** |
| Config snippet, Http tab, captures the thrown error (`getting-started-config/javascript.gcp-functions.mdx:1-37`) | **yes**, `auto.function.serverless.gcp_http`, `handled: false`, request data present |
| Config snippet, Background tab, `wrapEventFunction` (`:39-76`) | **yes** for the error; the function span never ends (callback signature + synchronous throw) |
| Config snippet, CloudEvent tab, `wrapCloudEventFunction` (`:78-115`) | **yes** for the error; same missing function span |
| Verify issues, Http tab (`index.mdx:96-98`) | **yes** |
| Verify issues, Background tab, `Sentry.wrapBackgroundFunction` (`index.mdx:102-106`) | **no**, `TypeError: Sentry.wrapBackgroundFunction is not a function`, the function never loads |
| Verify issues, CloudEvent tab (`index.mdx:110-112`) | **yes** for the error, no function span |
| Verify tracing, Http tab (`index.mdx:131-141`) | **yes**, `test` child of the `function.gcp` segment in a `span` envelope, no transaction |
| Verify tracing, Background tab (`index.mdx:145-155`) | **no**, same `TypeError`; with `wrapEventFunction` it works (204, `function.gcp` span nested under `http.server`) |
| Verify tracing, CloudEvent tab (`index.mdx:159-167`) | **yes** |
| "capture 100% of transactions" (`getting-started-config/javascript.gcp-functions.mdx:19`), "what transactions are captured" (`automatic-instrumentation.mdx:3`) | **no**, only `span` envelopes arrive under the default lifecycle (`transaction_envelopes: 0` in every variant) |
| "automatically capture spans for incoming, and outgoing HTTP requests" (`automatic-instrumentation.mdx:7`) | **yes** for incoming (`http.server` segment per request, in a separate trace from the HTTP function span); outgoing not exercised |
| Database integrations are added manually (`automatic-instrumentation.mdx:9`) | **yes**, none is a default here |
| `Sentry.pgIntegration()`, `Sentry.ioredisIntegration()` (`automatic-instrumentation.mdx:31,35`) | **no**, `TypeError`, the exports are `postgresIntegration` and `redisIntegration` |
| Logs verify step (`index.mdx:176-180`) | **never rendered**, `logs` is not an onboarding option of this page; `Sentry.logger.info` does arrive as a `log` item with the guide's config |
| Function name on spans | **local gap**: `faas.name` and the segment name need `FUNCTION_TARGET` or `K_SERVICE` in the environment; the guide never says how to run or deploy the function |

## Files

`package.json`, `run.sh`, `summarize.mjs`, `sink.mjs` (a copy of `../koa/sink.mjs` that also records every span
attribute, the `gcp.function.context` and `cloud_resource` contexts), `function-http.js`,
`function-http-errors-only.js`, `function-http-verify.js`, `function-http-tracing.js`, `function-event.js`,
`function-event-verify.js`, `function-event-tracing-verbatim.js`, `function-event-tracing.js`,
`function-cloudevent.js`, `function-cloudevent-verify.js`, `function-cloudevent-tracing.js`,
`function-auto-instrumentation.js`, `results-<variant>.json`, `app-<variant>.log`, `sink-<variant>.log`.
