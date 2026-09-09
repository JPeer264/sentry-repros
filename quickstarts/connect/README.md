# QS-connect, Connect getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
`connect` `3.7.0` from the registry (the guide names no major, `npm install connect` gives 3, the integration
page lists `connect: ^3.0.0`). All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Node.js run in `../node/README.md` covers the plain-Node install variants, the Express, Fastify and Koa runs
(`../express/README.md`, `../fastify/README.md`, `../koa/README.md`) cover the same guide skeleton for those
frameworks. Findings that are Node-only (the `--require` banner, the removed `@sentry/node/preload` entry, the
extensionless ESM import, the missing-release session warning) are cited from there and only their Connect status
is recorded here.

## What it reproduces

A new user following the Connect guide end to end: install, write `instrument.(js|mjs)`, apply it the way each
tab says, call `Sentry.setupConnectErrorHandler(app)`, and run the verify step. One Connect app with these
mounts (`app.use(path, fn)` is the only routing Connect has):

| Route | What it does | Snippet |
| --- | --- | --- |
| `/debug-sentry` | `app.use("/debug-sentry", (req, res) => { throw new Error("My first Sentry error!"); });` | `getting-started-verify/javascript.connect.mdx:13-15`, verbatim |
| `/debug-sentry-tracing` | the `async (req, res)` handler with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` that throws | `getting-started-verify/javascript.connect.mdx:36-47`, verbatim except the path so both verify snippets share one server |
| `/users/42` | `app.use("/users", ...)` echoes the rest of the path | repro-only |
| `/error-404`, `/error-503` | `next(err)` with `err.status = 404` (and 503), to see which forwarded errors reach Sentry | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named plain middleware (`auditMiddleware`) is mounted before the routes so middleware spans would be visible.
The readiness probe hits `/nope` (unmatched path, Connect's `finalhandler` answers 404).

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.connect`), then
`fallbackGuide` (`javascript.node`, from `guides/connect/index.mdx:5`), then platform (`javascript`), then
`_default`. Only three includes have a `javascript.connect.mdx` on the getting-started path: `getting-started-use`,
`getting-started-verify` and `getting-started-add-top-level-import`.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/connect/index.mdx:12` `getting-started-node` | `platform-includes/getting-started-node/javascript.mdx` (no connect or node file) |
| `getting-started-node/javascript.mdx:1` prerequisites | `platform-includes/getting-started-prerequisites/javascript.node.mdx:1-16` |
| `getting-started-node/javascript.mdx:13` features expandable | `includes/quick-start-features-expandable.mdx:29-36` (Connect listed in the server row) |
| `getting-started-node/javascript.mdx:26` install | `platform-includes/getting-started-install/javascript.node.mdx:3-13` (`@sentry/node` only) |
| `getting-started-node/javascript.mdx:45` config | `platform-includes/getting-started-config/javascript.node.mdx:1-35` (CommonJS `instrument.js`) and `:37-71` (ESM `instrument.mjs`) |
| `getting-started-node/javascript.mdx:76` apply (heading "CommonJS") | `platform-includes/getting-started-use/javascript.connect.mdx:1-16` (CommonJS tab) and `:18-33` (ESM tab) |
| `getting-started-node/javascript.mdx:93-96` ESM | inline: `node --import ./instrument.mjs app.mjs` |
| `getting-started-node/javascript.mdx:102` capture errors | nothing: `platform-includes/getting-started-capture-errors/` has no `javascript.connect.mdx`, `javascript.node.mdx`, `javascript.mdx` or `_default.mdx` |
| `getting-started-node/javascript.mdx:106`, `:110` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `getting-started-node/javascript.mdx:116` verify | `platform-includes/getting-started-verify/javascript.connect.mdx:12-16` (issues), `:35-48` (tracing), `:56-58` (logs, only under a `logs` onboarding option that `javascript.mdx:9-11` does not offer) |
| `getting-started-node/javascript.mdx:122` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| `getting-started-node/javascript.mdx:61` install methods link | `docs/platforms/javascript/common/install/{index,esm,commonjs,esm-without-import,late-initialization}.mdx` (`javascript.connect` at `:7` of the last four; `index.mdx` lists it in no `notSupported` entry) |
| Connect integration page | `docs/platforms/javascript/common/configuration/integrations/connect.mdx:1-31` (no includes); listed as auto-enabled with tracing in `platform-includes/configuration/integrations/javascript.connect.mdx:7` |
| Connect automatic instrumentation page | `docs/platforms/javascript/guides/connect/tracing/instrumentation/automatic-instrumentation.mdx:6` -> `includes/node-automatic-instrumentation.mdx` (no Connect mention) |
| `platform-includes/getting-started-add-top-level-import/javascript.connect.mdx` | rendered by no page (no `includePath` references it) |

## Install

```bash
cd $REPRO/quickstarts/connect
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus connect@3
```

## Run

```bash
cd $REPRO/quickstarts/connect
./run.sh import                   # node --import ./instrument.mjs app.mjs                          -> results-import.json
./run.sh cjs                      # node app.js  (require("./instrument") first line)                -> results-cjs.json
./run.sh esm-tab                  # node app-esm-tab.mjs  (ESM tab verbatim, import "./instrument")   -> results-esm-tab.json
./run.sh self-import              # node app-first-line.mjs  (import "./instrument.mjs" first line)   -> results-self-import.json
./run.sh node-options             # NODE_OPTIONS="--import ./instrument.mjs" node app.mjs           -> results-node-options.json
./run.sh top-level-import         # node app-top-level-import.mjs (unrendered add-top-level-import include, import './instrument.js') -> results-top-level-import.json
./run.sh no-handler               # --import, guide app without setupConnectErrorHandler            -> results-no-handler.json
./run.sh cjs-no-handler           # node app-no-handler.js                                          -> results-cjs-no-handler.json
./run.sh self-import-no-handler   # node app-first-line-no-handler.mjs                              -> results-self-import-no-handler.json
./run.sh node-options-no-handler  # NODE_OPTIONS="--import ./instrument.mjs" node app-no-handler.mjs -> results-node-options-no-handler.json
./run.sh require-flag-no-handler  # node --require ./instrument.js app-no-handler.mjs               -> results-require-flag-no-handler.json
./run.sh integration-options      # --import instrument-options.mjs (integrations: [Sentry.connectIntegration()]) -> results-integration-options.json
./run.sh errors-only              # --import instrument-errors-only.mjs (no tracesSampleRate), no-handler app -> results-errors-only.json
./run.sh late-init                # node --import @sentry/node/preload app-late.mjs                 -> results-late-init.json
```

Each run starts the sink on `127.0.0.1:4726` and one app on `127.0.0.1:4727` (both checked free first), curls
the routes in order (`/users/42`, `/debug-sentry`, `/error-404`, `/error-503`, `/debug-log`,
`/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), polls `/__items` until the sentinel event, the
sentinel's server span (skipped for `errors-only`, which sends no spans) and the log batch have all arrived (hard
deadline 60 s, no fixed sleeps), writes `results-<variant>.json` (steps with HTTP codes, console output with the
installed integrations, the compact sink items, the raw span payloads and a computed verdict) via
`summarize.mjs`, and kills both processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.node.mdx:3-5`: `npm install @sentry/node`.
- `getting-started-config/javascript.node.mdx:37-70`: create `instrument.mjs` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `getting-started-node/javascript.mdx:55`: import `instrument.js` before any other module or "auto-instrumentation ... may not work".
- `getting-started-use/javascript.connect.mdx:1-16`: CommonJS, `require("./instrument");` first, `Sentry.setupConnectErrorHandler(app)` right after `connect()`, before the routes.
- `getting-started-use/javascript.connect.mdx:18-33`: ESM, `import "./instrument";` first, same error handler call.
- `getting-started-node/javascript.mdx:88-96`: ESM, `node --import ./instrument.mjs app.mjs`.
- `getting-started-verify/javascript.connect.mdx:7,13-15`: "Add the following code snippet to your main application file; it defines a route", `app.use("/debug-sentry", ...)` throws and creates an issue.
- `getting-started-verify/javascript.connect.mdx:30,36-47`: "update the previous code snippet by starting a trace" with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` inside an `async (req, res)` handler that throws.
- `install/esm.mdx:44-48`: `NODE_OPTIONS="--import ./instrument.mjs" npm run start` as an alternative.
- `install/esm-without-import.mdx:26-34`: a first-line import means "only native Node.js APIs can be instrumented ... will not capture data from ... framework-specific data".
- `install/late-initialization.mdx:37,68`: `node --require @sentry/node/preload app.js` / `node --import @sentry/node/preload app.js`, then `Sentry.init()` later; `:103-124` `SENTRY_PRELOAD_INTEGRATIONS` with `Connect` at `:113`.
- `integrations/connect.mdx:3`: "Adds performance instrumentation for Connect. (default)"; `:17` `Sentry.connectIntegration`; `:19` "enabled by default when performance monitoring is enabled"; `:21` "adds instrumentation for the Hapi framework to capture spans using `@opentelemetry/instrumentation-connect`"; `:23-27` `Sentry.init({ integrations: [Sentry.connectIntegration()] })`; `:29-31` supported versions `connect: ^3.0.0`.
- `platform-includes/configuration/integrations/javascript.connect.mdx:7`: `connectIntegration`, auto enabled, tracing.
- `guides/connect/tracing/instrumentation/automatic-instrumentation.mdx:3`: "Learn what transactions are captured after tracing is enabled in the Sentry Connect SDK."
- `migration/v10-to-v11/index.mdx:436`: request handlers of "Express, Koa, Connect, Fastify, Elysia, NestJS" get the `handler` op; `:713-720` Express, Fastify, Koa and Hapi errors are captured by their integrations (Connect not listed); `:1370` "The `connect` instrumentation and the deprecated `prismaInstrumentation` option were removed."

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `connect@3` succeeded (`added 73 packages in 17s`).
`node_modules/@sentry` holds `bundler-plugins conventions core node opentelemetry server-runtime-injection
server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*` entry except
`@sentry/conventions@0.20.0` (a normal published dependency). **Holds.**

Exports the snippets use, checked in `node_modules/@sentry/node/build/types/index.d.ts` (no `connect` match in
the file), `node_modules/@sentry/node/build/types/integrations/tracing/` (only `hapi.d.ts`, `koa.d.ts`),
`node_modules/@sentry/server-utils/build/types/integrations/` (`express`, `fastify`, `hapi`, `koa`, no
`connect`) and at runtime (`typeof` on the ESM namespace):

| Export | Status on develop |
| --- | --- |
| `setupConnectErrorHandler(app)` (`getting-started-use/javascript.connect.mdx:11,28`, `getting-started-add-top-level-import/javascript.connect.mdx:9,24`) | **does not exist**: not in `index.d.ts`, `typeof Sentry.setupConnectErrorHandler === "undefined"`; the only `setup*ErrorHandler` exports are `setupExpressErrorHandler`, `setupFastifyErrorHandler`, `setupHapiErrorHandler`, `setupKoaErrorHandler` (all `@deprecated`, see `../koa/README.md`) |
| `connectIntegration()` (`integrations/connect.mdx:17,25`) | **does not exist**: `typeof Sentry.connectIntegration === "undefined"`; the framework integrations exported are `expressIntegration`, `fastifyIntegration`, `hapiIntegration`, `koaIntegration` |
| `@opentelemetry/instrumentation-connect` (`integrations/connect.mdx:21`) | **not installed**: `node_modules/@opentelemetry/` holds only `api`; no `connect` orchestrion config or diagnostics-channel subscriber exists in `@sentry/server-utils/build/esm/` |
| `@sentry/node/preload` | **does not exist**: the package `exports` are `./package.json . ./import ./vite ./rollup ./webpack ./esbuild` (see `../express/README.md`) |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger.info` | exist |

The SDK repo confirms it: `packages/node/src` and `packages/server-utils/src` have no `connectIntegration` or
`setupConnectErrorHandler` (only stale `build/` output does), and the migration page says so at
`v10-to-v11/index.mdx:1370`. The Connect guide, the Connect integration page, the integrations table and the
migration page's own op table (`:436`) still describe it.

### Step 2, Configure

`instrument.mjs` / `instrument.js` are the config snippets verbatim plus `tunnel` and `debug: true`.
`debug: true` prints no SDK name or version; identity was read off the envelopes: `sentry.javascript.node`
`10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** with `tracesSampleRate: 1.0`, identical to the
Express, Fastify and Koa runs, and **none of them is `Connect`**:

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

With the "error-monitoring" option only (no `tracesSampleRate`, `errors-only`), **23 integrations**, again no
`Connect`:

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `SDK initialized from ESM` (or `CommonJS`), `[Sentry] Runtime hook
registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, one `[instrumentation:<lib>] not
injected yet, waiting for the module to load` line per framework or library integration (none names `connect`),
and once per run `Sentry Logger [warn]: Discarded session because of missing or non-string release`; the guide's
config sets no `release` (`../node/README.md`). No deprecation notice is printed in any variant
(`deprecation_output: []`).

### Step 3, Apply instrumentation: every guide app crashes before it listens

`import` (`node --import ./instrument.mjs app.mjs`, the guide's ESM app body `getting-started-use/javascript.connect.mdx:22-32`):
the SDK initializes (46 integrations), then

```
Sentry Logger [log]: Captured error event `Sentry.setupConnectErrorHandler is not a function`
TypeError: Sentry.setupConnectErrorHandler is not a function
    at file://$REPRO/quickstarts/connect/app.mjs:9:8
```

The process exits before `app.listen`; the sink holds one event, `TypeError: Sentry.setupConnectErrorHandler is
not a function` with `mechanism: auto.node.onuncaughtexception`, `handled: false`, no `transaction`, no request
data. `results-import.json`. The same crash, at the same line of each file, for `cjs` (`app.js:13:8`, `SDK
initialized from CommonJS`), `self-import` (`app-first-line.mjs:12:8`), `node-options` and `top-level-import`
(`getting-started-add-top-level-import/javascript.connect.mdx:16-29`, `import './instrument.js'`).
`esm-tab` (`import "./instrument";` verbatim, `getting-started-use/javascript.connect.mdx:20`) fails one step
earlier with `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/connect/instrument' imported
from $REPRO/quickstarts/connect/app-esm-tab.mjs ... Did you mean to import "./instrument.js"?`, the same
extensionless import as the Express, Fastify and Koa tabs and `install/esm-without-import.mdx:55`; with the
extension fixed it reaches the `TypeError` (`self-import`). `integration-options`
(`integrations/connect.mdx:23-27`, `integrations: [Sentry.connectIntegration()]`) dies inside `instrument-options.mjs`
with `TypeError: Sentry.connectIntegration is not a function` before the SDK initializes (0 integrations, 0 events).
`late-init` (`node --import @sentry/node/preload app-late.mjs`, `install/late-initialization.mdx:68`):
`Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './preload' is not defined by "exports"`, as in
`../express/README.md`.

So there is no variant in which the guide's own application file starts. Everything below uses the app with the
`Sentry.setupConnectErrorHandler(app)` line deleted (`app-no-handler.*`), which is what a user has to do to get
past Step 3.

### Step 4, Verify, on the app without the handler line (variant `no-handler`, `results-no-handler.json`)

`/debug-sentry` (`getting-started-verify/javascript.connect.mdx:13-15`): HTTP 500, written by Connect's
`finalhandler`, and Connect's default `logerror` prints `Error: My first Sentry error!` with its stack to stderr.
**No error event reaches the sink.** Connect wraps every handler call in `try/catch` (`connect/index.js:225-248`),
turns the throw into `next(err)`, and nothing in this build listens: there is no Connect integration and no
error handler to install. The same holds for the forwarded `next(err)` errors of `/error-404` and `/error-503`
(HTTP 404 and 503, nothing captured). The guide's first verify step therefore produces no issue.

`/debug-sentry-tracing` (`getting-started-verify/javascript.connect.mdx:36-47`, the `async (req, res)` handler):
the request **hangs**; curl gave up after 3 s (`http_code 000`, `curl_exit 28`). Connect 3 does not handle
promises, so the rejected handler promise is never turned into `next(err)` and no response is written. The error
does arrive, but as an unhandled rejection: `Error: My first Sentry error!` with
`mechanism: auto.node.onunhandledrejection`, `handled: false`, `transaction: GET /debug-sentry-tracing`, request
url, method and headers present. The app log shows the SDK's warning block (`This error originated either by
throwing inside of an async function without a catch block ...`), and the process keeps running. The manual span
arrives as a `test` child named `My First Test Transaction` (`status: error`, `sentry.status.message:
internal_error`, `origin: manual`) inside a `span` envelope, under a segment named `GET`. There is no transaction
anywhere in the sink; the page text ("starting a trace") and the automatic instrumentation page ("what
transactions are captured") do not say that. Same behaviour as Express 4 in `../express/README.md` (Step 4),
unlike Koa and Express 5 where the framework forwards the rejection.

The aborted request also shows an SDK quirk: its `http.server` segment arrives with `status: ok`,
`http.response.status_code: 200` and a 3.009 s duration although no response was ever written; the span closed
when curl dropped the socket and reported the default status code.

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle:
stream` on every span); **no `transaction` envelope was sent for any route in any variant**. Every segment is
named by the bare method with `sentry.segment.name.source: url`, no `http.route`, op `http.server`, origin
`auto.http.http_server` (the `url.path` attribute still carries the path):

```
GET   [source=url status=error 404]   /nope (readiness probe)
GET   [source=url status=ok    200]   /users/42
GET   [source=url status=error 500]   /debug-sentry
GET   [source=url status=error 404]   /error-404
GET   [source=url status=error 503]   /error-503
GET   [source=url status=ok    200]   /debug-log
GET   [source=url status=ok    200]   /debug-sentry-tracing (aborted by curl, see above)
GET   [source=url status=ok    200]   /sentinel
```

The only child span in the whole run is the manual `test` span: no `handler`, `middleware` or
`request_handler.connect` span, no span with a `connect` origin, and `auditMiddleware` never appears. The
`v10-to-v11/index.mdx:436` `handler` op for Connect request handlers does not exist in this build.

Log item: `{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage` event
with `mechanism: generic`, `handled: true`, `transaction: GET /sentinel` (the event `transaction` field is derived
from the request, the span name is not).

### Step 5, Manual setup variants (all on the no-handler app)

`no-handler`, `cjs-no-handler`, `self-import-no-handler`, `node-options-no-handler`, `require-flag-no-handler`
produced **the same item shapes**: 2 events (the unhandled rejection and the sentinel), 8 `span` envelopes, 1
`log`, 46 integrations, `GET`/`url` segments, one manual `test` child, `/debug-sentry` not captured, 4 Connect
`logerror` blocks on stderr (`connect_default_error_log: 4`).

- **`self-import-no-handler`** (first-line `import "./instrument.mjs"`, no flag): identical to `--import`.
  Because the build has no Connect instrumentation, the direct-import method loses nothing here that `--import`
  had; the `install/esm-without-import.mdx:28-30` warning has no Connect-specific effect (contrast Koa in
  `../koa/README.md`, which loses its spans and error capture).
- **`cjs-no-handler`**: works the same; `SDK initialized from CommonJS`.
- **`node-options-no-handler`**: identical to the flag.
- **`require-flag-no-handler`** (`node --require ./instrument.js app-no-handler.mjs`): same data, but prints
  `[Sentry] Initializing the SDK via the Node \`--require\` flag is no longer supported ...` first, already
  reported in `../node/README.md`.
- **`errors-only`** (config without `tracesSampleRate`): 23 integrations, 0 `span` envelopes, the same 2 events
  (`auto.node.onunhandledrejection` with `transaction: GET /debug-sentry-tracing`, and the sentinel), 1 log.
  `/debug-sentry` is still not captured.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` is all you need (`getting-started-install/javascript.node.mdx:3-5`) | **yes** |
| `instrument.mjs` snippet initializes the SDK (`getting-started-config/javascript.node.mdx:37-70`) | **yes** |
| CommonJS tab, `require("./instrument")` then `setupConnectErrorHandler(app)` (`getting-started-use/javascript.connect.mdx:1-16`) | **no**, `TypeError: Sentry.setupConnectErrorHandler is not a function`, the process exits before listening |
| ESM tab, `import "./instrument";` then `setupConnectErrorHandler(app)` (`getting-started-use/javascript.connect.mdx:18-33`) | **no**, `ERR_MODULE_NOT_FOUND` on the extensionless import; with `./instrument.mjs` the same `TypeError` |
| `node --import ./instrument.mjs app.mjs` runs the guide app (`getting-started-node/javascript.mdx:93-96`) | **no** for the guide's app file (the `TypeError`); **yes** once the handler line is deleted |
| Init before any other module or "auto-instrumentation ... may not work" (`getting-started-node/javascript.mdx:55`) | **not observable** for Connect: there is no Connect instrumentation that a late import could lose; a first-line import gives the same data as `--import` |
| Verify snippet creates an issue (`getting-started-verify/javascript.connect.mdx:7,13-15`) | **no**, Connect catches the throw and answers 500, nothing is captured in any variant |
| Tracing verify snippet (`getting-started-verify/javascript.connect.mdx:36-47`) | **partial**, the request hangs and the error is captured as an unhandled rejection; the span is a `test` child in a `span` envelope, there is no transaction |
| `NODE_OPTIONS="--import ./instrument.mjs"` alternative (`install/esm.mdx:44-48`) | **yes** (no-handler app), same crash as `--import` with the guide app |
| Direct import loses framework data (`install/esm-without-import.mdx:28-30`) | **not observable** for Connect, there is no framework data under either method |
| `@sentry/node/preload` late initialization (`install/late-initialization.mdx:37,68`, `Connect` at `:113`) | **no**, subpath not exported |
| Connect integration exists and is on by default with tracing (`integrations/connect.mdx:3,17,19`, `configuration/integrations/javascript.connect.mdx:7`) | **no**, `connectIntegration` is not exported and no `Connect` integration is installed with or without tracing |
| `Sentry.init({ integrations: [Sentry.connectIntegration()] })` (`integrations/connect.mdx:23-27`) | **no**, `TypeError: Sentry.connectIntegration is not a function` |
| Spans come from `@opentelemetry/instrumentation-connect` for "the Hapi framework" (`integrations/connect.mdx:21`) | **no**, the package is not installed, no Connect span of any origin was produced, and the sentence names the wrong framework |
| Supported versions `connect: ^3.0.0` (`integrations/connect.mdx:29-31`) | **stale**, nothing instruments `connect` `3.7.0` beyond the generic `http.server` segment |
| "what transactions are captured" (`guides/connect/tracing/instrumentation/automatic-instrumentation.mdx:3`) | **no**, only `span` envelopes arrive under the default lifecycle, and none is Connect-specific |
| Connect request handlers get the `handler` op (`v10-to-v11/index.mdx:436`) | **no**, no child span other than the manual one; contradicted by the same page at `:1370` |
| Framework errors are captured automatically (`v10-to-v11/index.mdx:713-720`, Connect not listed) | **right to omit Connect**: Connect errors are not captured at all |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **not tested**, only Node v26.5.0 was available |

## Files

`package.json`, `instrument.mjs`, `instrument.js`, `instrument-options.mjs`, `instrument-errors-only.mjs`,
`routes.mjs`, `routes.js`, `app.mjs`, `app.js`, `app-esm-tab.mjs`, `app-first-line.mjs`, `app-top-level-import.mjs`,
`app-no-handler.mjs`, `app-no-handler.js`, `app-first-line-no-handler.mjs`, `app-late.mjs`, `run.sh`,
`summarize.mjs`, `sink.mjs` (a copy of `../koa/sink.mjs`), `results-<variant>.json`, `app-<variant>.log`,
`sink-<variant>.log`.
