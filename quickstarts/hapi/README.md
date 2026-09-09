# QS-hapi, Hapi getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
`@hapi/hapi` `21.4.10` and `@hapi/boom` `10.0.1` from the registry (their current majors; the integration page
lists `>=17.0.0 <22`). All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Node.js run in `../node/README.md` covers the plain-Node install variants, the Express run in
`../express/README.md`, the Fastify run in `../fastify/README.md` and the Koa run in `../koa/README.md` cover the
same guide skeleton for those frameworks. Findings that are Node-only (the `--require` banner, the removed
`@sentry/node/preload` entry, the extensionless ESM import, the missing-release session warning) are cited from
there and only their Hapi status is recorded here.

## What it reproduces

A new user following the Hapi guide end to end: install, write `instrument.(js|mjs)`, apply it the way each tab
says, call `await Sentry.setupHapiErrorHandler(server)`, and run the verify step. One Hapi server with these routes:

| Route | What it does | Snippet |
| --- | --- | --- |
| `/debug-sentry` | `server.route({ method: "GET", path: "/debug-sentry", handler: (request, h) => { throw new Error("My first Sentry error!"); } })` | `getting-started-verify/javascript.hapi.mdx:13-19`, verbatim |
| `/debug-sentry-tracing` | the `async (request, h)` handler with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` that throws | `getting-started-verify/javascript.hapi.mdx:40-55`, verbatim except the path so both verify snippets share one server |
| `/users/{id}` | returns `{ id: request.params.id }`, a parameterized route for span naming | repro-only |
| `/plugin/{id}` | the same, registered by a plugin (`server.register({ name: "audit-plugin", ... })`), for the `handler` span | repro-only |
| `/error-404`, `/error-500`, `/error-503` | `throw Boom.notFound("custom 404")`, `Boom.badImplementation("custom 500")`, `Boom.serverUnavailable("custom 503")`, to see which Boom errors reach Sentry | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named request extension (`server.ext("onRequest", function auditExt ...)`) is registered before the routes so
ext (middleware) spans are visible. The readiness probe hits `/nope` (unmatched route), which shows how an
unrouted request is named. The guide's `port: 3030, host: 'localhost'` is replaced by `APP_PORT` on `127.0.0.1`.

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.hapi`), then
`fallbackGuide` (`javascript.node`, from `guides/hapi/index.mdx:5`), then platform (`javascript`), then `_default`.
Only two includes have a `javascript.hapi.mdx` on the guide's path: `getting-started-use` and `getting-started-verify`.
There is no `getting-started-add-top-level-import/javascript.hapi.mdx` (Koa, Express, Fastify, Connect and Node
have one), so the "top-level-import" variant of the other runs has no Hapi counterpart.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/hapi/index.mdx:12` `getting-started-node` | `platform-includes/getting-started-node/javascript.mdx` (no hapi or node file) |
| `getting-started-node/javascript.mdx:1` prerequisites | `platform-includes/getting-started-prerequisites/javascript.node.mdx:1-16` |
| `getting-started-node/javascript.mdx:13` features expandable | `includes/quick-start-features-expandable.mdx:29-36` (Hapi listed in the server row) |
| `getting-started-node/javascript.mdx:26` install | `platform-includes/getting-started-install/javascript.node.mdx:3-13` (`@sentry/node` only) |
| `getting-started-node/javascript.mdx:45` config | `platform-includes/getting-started-config/javascript.node.mdx:1-35` (CommonJS `instrument.js`) and `:37-71` (ESM `instrument.mjs`) |
| `getting-started-node/javascript.mdx:76` apply (heading "CommonJS") | `platform-includes/getting-started-use/javascript.hapi.mdx:1-24` (CommonJS tab) and `:26-48` (ESM tab) |
| `getting-started-node/javascript.mdx:93-96` ESM | inline: `node --import ./instrument.mjs app.mjs` |
| `getting-started-node/javascript.mdx:102` capture errors | nothing: `platform-includes/getting-started-capture-errors/` has no `javascript.hapi.mdx`, `javascript.node.mdx`, `javascript.mdx` or `_default.mdx` |
| `getting-started-node/javascript.mdx:106`, `:110` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `getting-started-node/javascript.mdx:116` verify | `platform-includes/getting-started-verify/javascript.hapi.mdx:12-20` (issues), `:39-56` (tracing), `:64-66` (logs, only under a `logs` onboarding option that `javascript.mdx:9-11` does not offer) |
| `getting-started-node/javascript.mdx:122` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| `getting-started-node/javascript.mdx:61` install methods link | `docs/platforms/javascript/common/install/{index,esm,commonjs,esm-without-import,late-initialization}.mdx` (all list `javascript.hapi` at `:10`) |
| Hapi integration page | `docs/platforms/javascript/common/configuration/integrations/hapi.mdx:1-31` (no includes) |
| Integrations table | `platform-includes/configuration/integrations/javascript.hapi.mdx:12` (`hapiIntegration`: Auto Enabled, Tracing; the Errors column is empty) |
| Hapi automatic instrumentation page | `docs/platforms/javascript/guides/hapi/tracing/instrumentation/automatic-instrumentation.mdx:6` -> `includes/node-automatic-instrumentation.mdx` (no Hapi mention) |

## Install

```bash
cd $REPRO/quickstarts/hapi
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus @hapi/hapi@21 and @hapi/boom@10
```

## Run

```bash
cd $REPRO/quickstarts/hapi
./run.sh import                  # node --import ./instrument.mjs app.mjs                          -> results-import.json
./run.sh cjs                     # node app.js  (require("./instrument") first line)                -> results-cjs.json
./run.sh esm-tab                 # node app-esm-tab.mjs  (ESM tab verbatim, import "./instrument")   -> results-esm-tab.json
./run.sh self-import             # node app-first-line.mjs  (import "./instrument.mjs" first line)   -> results-self-import.json
./run.sh self-import-no-handler  # same, without setupHapiErrorHandler                              -> results-self-import-no-handler.json
./run.sh node-options            # NODE_OPTIONS="--import ./instrument.mjs" node app.mjs           -> results-node-options.json
./run.sh require-flag            # node --require ./instrument.js app.mjs                          -> results-require-flag.json
./run.sh no-handler              # --import, app without setupHapiErrorHandler                      -> results-no-handler.json
./run.sh integration-options     # --import instrument-options.mjs (hapiIntegration({ shouldHandleError })) -> results-integration-options.json
./run.sh errors-only             # --import instrument-errors-only.mjs (no tracesSampleRate)       -> results-errors-only.json
./run.sh errors-only-no-handler  # same, app without setupHapiErrorHandler                          -> results-errors-only-no-handler.json
./run.sh verify-verbatim         # node app-verify-verbatim.mjs (verify snippet pasted into the guide app, nothing else) -> results-verify-verbatim.json
./run.sh late-init               # node --import @sentry/node/preload app-late.mjs                 -> results-late-init.json
```

Each run starts the sink on `127.0.0.1:4724` and one app on `127.0.0.1:4725` (both checked free first), curls
the routes in order (`/users/42`, `/plugin/7`, `/debug-sentry`, `/error-404`, `/error-500`, `/error-503`,
`/debug-log`, `/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), polls `/__items` until the sentinel
event, the sentinel's server span (skipped for the `errors-only*` variants, which send no spans) and the log
batch have all arrived (hard deadline 60 s, no fixed sleeps), writes `results-<variant>.json` (steps with HTTP
codes, console output with the installed integrations, the compact sink items, the raw span payloads and a
computed verdict) via `summarize.mjs`, and kills both processes (also on exit via a trap). `verify-verbatim`
has only the guide's `/debug-sentry` route, so its error event and server span are the sentinel there. Machine
paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.node.mdx:3-5`: `npm install @sentry/node`.
- `getting-started-config/javascript.node.mdx:37-70`: create `instrument.mjs` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `getting-started-node/javascript.mdx:55`: import `instrument.js` before any other module or "auto-instrumentation ... may not work".
- `getting-started-use/javascript.hapi.mdx:1-24`: CommonJS, `require("./instrument");` first, `Hapi.server({ port: 3030, host: 'localhost' })`, routes, then `await Sentry.setupHapiErrorHandler(server)` before `await server.start()`.
- `getting-started-use/javascript.hapi.mdx:26-48`: ESM, `import "./instrument";` first, same error handler call.
- `getting-started-node/javascript.mdx:88-96`: ESM, `node --import ./instrument.mjs app.mjs`.
- `getting-started-verify/javascript.hapi.mdx:7,13-19`: "Add the following code snippet to your main application file; it defines a route", `server.route({ ..., path: "/debug-sentry", handler })` throws and creates an issue.
- `getting-started-verify/javascript.hapi.mdx:34,40-55`: "update the previous code snippet by starting a trace" with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` inside an `async (request, h)` handler that throws.
- `install/esm.mdx:44-48`: `NODE_OPTIONS="--import ./instrument.mjs" npm run start` as an alternative.
- `install/esm-without-import.mdx:26-34`: a first-line import means "only native Node.js APIs can be instrumented ... will not capture data from ... framework-specific data"; `:53-60` the snippet, `import "./instrument";` at `:55`.
- `install/late-initialization.mdx:37,68`: `node --require @sentry/node/preload app.js` / `node --import @sentry/node/preload app.js`, then `Sentry.init()` later; `:103-124` `SENTRY_PRELOAD_INTEGRATIONS` with `Hapi` at `:115`.
- `integrations/hapi.mdx:3`: "Adds performance instrumentation for Hapi. (default)"; `:13` Node.js and Bun only; `:17-21` `Sentry.hapiIntegration`, "enabled by default when performance monitoring is enabled", "adds instrumentation for the Hapi framework to capture spans using `@opentelemetry/instrumentation-hapi`"; `:23-27` `Sentry.init({ integrations: [Sentry.hapiIntegration()] })` with no options; `:29-31` supported versions `>=17.0.0 <22`.
- `configuration/integrations/javascript.hapi.mdx:12`: `hapiIntegration` is Auto Enabled and Tracing; the Errors column is empty.
- `guides/hapi/tracing/instrumentation/automatic-instrumentation.mdx:3`: "Learn what transactions are captured after tracing is enabled in the Sentry Hapi SDK."
- `migration/v10-to-v11/index.mdx:715-720`: Hapi errors are captured by the integration, `setupHapiErrorHandler(server)` is deprecated; `:722` `shouldHandleError` moved to `expressIntegration()` and `fastifyIntegration()` (Hapi not listed); `:391` Hapi resolves a route for `router` spans, `:392` and for `handler` spans; `:439-440` `router.hapi` -> `router`, `server.ext.hapi` -> `middleware`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `@hapi/hapi@21` and `@hapi/boom@10` succeeded (`added 89
packages in 13s`). `node_modules/@sentry` holds `bundler-plugins conventions core node opentelemetry
server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*`
entry except `@sentry/conventions@0.20.0` (a normal published dependency). **Holds.**

Exports the snippets use, checked in `node_modules/@sentry/node/build/types/index.d.ts:5,7`,
`node_modules/@sentry/node/build/types/integrations/tracing/hapi.d.ts` and
`node_modules/@sentry/server-utils/build/types/integrations/hapi/index.d.ts`:

| Export | Status on develop |
| --- | --- |
| `setupHapiErrorHandler(server)` | exists, `async`, `@deprecated` ("The error handler is now registered automatically when the Hapi server starts (via the orchestrion `@hapi/hapi` instrumentation), so calling this is no longer necessary. It remains a safe, idempotent operation when the handler is already attached, and is kept for setups where auto-registration is unavailable. This will be removed in a future major version."); one parameter typed `unknown`; delegates to `attachHapiErrorHandler`, which adds one `server.events.on({ name: 'request', channels: ['error'] })` listener |
| `hapiIntegration(options?)` | exists; the only option is `shouldHandleError(error, request)` ("By default, 5xx errors (and errors without a resolvable status) are sent, while 3xx and 4xx errors are not"); d.ts: "Diagnostics-channel-based hapi integration. Subscribes to the `orchestrion:@hapi/hapi:route` / `:ext` channels injected into `@hapi/hapi`'s `lib/server.js`. Requires the Sentry runtime hook or bundler plugin" |
| `@opentelemetry/instrumentation-hapi` (`integrations/hapi.mdx:21`) | **not installed**: not a dependency of `@sentry/node` or `@sentry/server-utils`, no `node_modules/@opentelemetry/*hapi*`; the build's orchestrion config targets `@hapi/hapi` `lib/server.js` `route`, `ext`, `start` and `initialize` with `versionRange: '>=17.0.0 <22.0.0'` |
| `@sentry/node/preload` | **does not exist**: the package `exports` are `. ./import ./vite ./rollup ./webpack ./esbuild` (see `../express/README.md`) |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger.info` | exist |

### Step 2, Configure

`instrument.mjs` / `instrument.js` are the config snippets verbatim plus `tunnel` and `debug: true`.
`debug: true` prints no SDK name or version; identity was read off the envelopes: `sentry.javascript.node`
`10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** with `tracesSampleRate: 1.0` (identical to the
Express, Fastify and Koa runs):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

With the "error-monitoring" option only (no `tracesSampleRate`, `errors-only`), **23 integrations**, and `Hapi` is
still one of them:

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `SDK initialized from ESM` (or `CommonJS`), `[Sentry] Runtime hook
registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per run `Sentry Logger [warn]:
Discarded session because of missing or non-string release`; the guide's config sets no `release`
(`../node/README.md`). No deprecation notice is printed for `setupHapiErrorHandler` at runtime
(`deprecation_output: []` in every variant).

### Step 3, Apply instrumentation (variant `import`, `results-import.json`)

Error event for `/debug-sentry` (HTTP 500 from Hapi's `Boom.boomify` of the thrown error):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.function.hapi","handled":false,
 "level":"error","sdk":"sentry.javascript.node","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4725/debug-sentry","method":"GET","hasData":false,"headers":{"host":"127.0.0.1:4725","user-agent":"curl/8.7.1","accept":"*/*"}},
 "user":{"ip_address":"127.0.0.1"},"environment":"production"}
```

**Four** error events per run, not the six the routes suggest: `/debug-sentry`, `Boom.badImplementation("custom
500")` (`Error: custom 500`, `auto.function.hapi`, `handled: false`, `transaction: GET /error-500`), the tracing
route, and the sentinel. **`Boom.notFound("custom 404")` and `Boom.serverUnavailable("custom 503") never
arrive**, in any variant, with or without the handler call, and also under `hapiIntegration({ shouldHandleError:
() => true })` (`integration-options`): the predicate was invoked exactly three times, every time with
`status=500`, never for the 404 or the 503. Hapi emits its `request` event on the `error` channel only when
`this.response.statusCode === 500 && this.response._error` (`node_modules/@hapi/hapi/lib/request.js:511-515`),
so the SDK's listener never sees a non-500 error and `shouldHandleError`'s "5xx are sent, 4xx are not" default
can only ever decide about 500s. No error was captured twice (`duplicate_error_events: []`).

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle:
stream` on every span); **no `transaction` envelope was sent for any route in any variant**. Segment names come
from the matched route (`sentry.segment.name.source=route`, `http.route` set, op `http.server`, origin
`auto.http.http_server`); the unmatched `/nope` probe is `GET` with `source=url`:

```
GET                         [source=url   status=error 404]   (readiness probe /nope)
GET /users/{id}             [source=route status=ok    200]
GET /plugin/{id}            [source=route status=ok    200]
GET /debug-sentry           [source=route status=error 500]
GET /error-404              [source=route status=error 404]
GET /error-500              [source=route status=error 500]
GET /error-503              [source=route status=error 503]
GET /debug-log              [source=route status=ok    200]
GET /debug-sentry-tracing   [source=route status=error 500]
GET /sentinel               [source=route status=ok    200]
```

Child spans per request, all `origin: auto.http.hapi`: `ext - onRequest - auditExt` (op `middleware`, `hapi.type:
server.ext`, on every request including `/nope`) and one `router` span named by the bare route path (`/users/{id}`,
with `hapi.type: router`, `http.route: /users/{id}`, `http.request.method: GET`). The plugin route gets a
`handler` span instead (`/plugin/{id}`, `hapi.type: plugin`, `hapi.plugin.name: audit-plugin`), matching
`v10-to-v11/index.mdx:391-392,439-440`. The `onRequest` ext span runs before routing, so it carries
`sentry.segment.name: GET` while its segment is later renamed to `GET /users/{id}`.

Log item: `{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage`
event with `mechanism: generic`, `handled: true`, `transaction: GET /sentinel`.

Hapi's own stderr output: one `Debug: internal, implementation, error` block per run, for `custom 500` only.
`Boom.badImplementation` marks the error `isDeveloperError`, which Hapi's default `debug.request:
['implementation']` prints; the guide's plain `throw new Error(...)` goes through `Boom.boomify`
(`node_modules/@hapi/hapi/lib/toolkit.js:64-70`) and is not printed. This is the same with and without
`setupHapiErrorHandler` (`hapi_debug_error_log` is 1 in every full variant), unlike Koa, where the handler call
silenced the framework's default logging (`../koa/README.md`).

### Step 4, Verify: the snippet runs as the guide presents it

`getting-started-verify/javascript.hapi.mdx:7` says to add `server.route({ ... })` "to your main application
file", and unlike the Koa guide the Hapi application file (`getting-started-use/javascript.hapi.mdx:26-48`) has
the `server` the snippet needs. Pasting the snippet where "All your routes etc." sits, with nothing else
(`app-verify-verbatim.mjs`, `results-verify-verbatim.json`): the server starts, `/debug-sentry` returns 500 and
the sink gets the event above plus a `GET /debug-sentry` segment with a `router /debug-sentry` child. **Holds.**

`/debug-sentry-tracing` (`getting-started-verify/javascript.hapi.mdx:40-55`): HTTP 500 after ~104 ms, error event
`mechanism: auto.function.hapi`, `handled: false`, `transaction: GET /debug-sentry-tracing`, plus a `test` span
`My First Test Transaction` (`status: error`, `origin: manual`) under the `router /debug-sentry-tracing` span
inside the `GET /debug-sentry-tracing` segment, in a `span` envelope. Hapi awaits the rejected handler promise,
so nothing hangs. The span is named "My First Test Transaction" but there is no transaction anywhere in the
sink; the page text ("starting a trace") and the automatic instrumentation page ("what transactions are
captured") do not say that.

### Step 5, Manual setup variants

`import`, `cjs`, `node-options`, `require-flag`, `no-handler`, `self-import`, `self-import-no-handler` all
produced **the same item shapes**: 4 events, 10 `span` envelopes, 1 `log`, 46 integrations, route-named
segments, `middleware`, `router` and `handler` child spans, `/debug-sentry` captured with `auto.function.hapi`.

- **`esm-tab`** (`getting-started-use/javascript.hapi.mdx:28`, `import "./instrument";` verbatim): the app
  does not start, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/hapi/instrument'
  imported from $REPRO/quickstarts/hapi/app-esm-tab.mjs ... Did you mean to import "./instrument.js"?`. Same
  extensionless import as the Express, Fastify and Koa tabs and `install/esm-without-import.mdx:55`.
  `results-esm-tab.json`.
- **`cjs`** (`require("./instrument");` verbatim, `app.js`): works; `SDK initialized from CommonJS`.
- **`self-import`** (`import "./instrument.mjs";` first line, no flag, the ESM tab with its extension fixed):
  **works fully**, identical to `--import`: every segment is route-named, every `router`, `handler` and
  `middleware` span is present, all 4 events arrive. `@hapi/hapi`'s `main` is `lib/index.js`, which
  `require('./server')`s at evaluation time (`node_modules/@hapi/hapi/lib/index.js:3`), after `instrument.mjs`
  has evaluated and `Sentry.init` has registered the hooks, so `lib/server.js` is still injected. The restriction
  in `install/esm-without-import.mdx:28-30` does not hold for Hapi (it does for Koa, `../koa/README.md`; it did not
  for Fastify either, `../fastify/README.md`). `results-self-import.json`.
- **`self-import-no-handler`** (same, without `setupHapiErrorHandler(server)`): same 4 events; the `start`
  channel fires and auto-registers the listener. `results-self-import-no-handler.json`.
- **`node-options`**: identical to the flag.
- **`require-flag`** (`node --require ./instrument.js app.mjs`): works fully but prints `[Sentry] Initializing
  the SDK via the Node \`--require\` flag is no longer supported ...` first, already reported in
  `../node/README.md`.
- **`no-handler`** (no `setupHapiErrorHandler(server)` at all, `--import`): the same 4 events,
  `auto.function.hapi`, `handled: false`. Nothing else differs from `import`; the deprecated call is a no-op
  on develop (it attaches the same single listener that `start` would attach). `results-no-handler.json`.
- **`integration-options`** (`hapiIntegration({ shouldHandleError })` returning `true` and printing the status,
  on the no-handler app): the option is wired (three `shouldHandleError status=500 ...` lines, one per 500) but
  changes nothing, because Hapi never reports the 404 or the 503 (Step 3). The integration page documents no
  option, and `v10-to-v11/index.mdx:722` lists `shouldHandleError` for Express and Fastify only.
  `results-integration-options.json`.
- **`errors-only`** / **`errors-only-no-handler`** (config without `tracesSampleRate`): 23 integrations, 0 `span`
  envelopes, the same 4 events with `auto.function.hapi` and `transaction: GET /debug-sentry`, with and without
  the handler call. The Hapi integration is installed and registers the error listener without tracing.
  `results-errors-only.json`, `results-errors-only-no-handler.json`.
- **`verify-verbatim`**: see Step 4. `results-verify-verbatim.json`.
- **`late-init`** (`node --import @sentry/node/preload app-late.mjs`, `install/late-initialization.mdx:68`):
  the app does not start, `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './preload' is not defined by
  "exports" in $REPRO/quickstarts/hapi/node_modules/@sentry/node/package.json`, as in `../express/README.md`;
  the page still lists `Hapi` at `:115`. `results-late-init.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` is all you need (`getting-started-install/javascript.node.mdx:3-5`) | **yes** (a Hapi user already has `@hapi/hapi`) |
| `instrument.mjs` snippet initializes the SDK (`getting-started-config/javascript.node.mdx:37-70`) | **yes** |
| CommonJS tab, `require("./instrument")` then `await setupHapiErrorHandler(server)` (`getting-started-use/javascript.hapi.mdx:1-24`) | **yes**, but the handler call is `@deprecated` and a no-op on develop |
| ESM tab, `import "./instrument";` (`getting-started-use/javascript.hapi.mdx:26-48`) | **no**, `ERR_MODULE_NOT_FOUND`; with `./instrument.mjs` it works fully |
| `node --import ./instrument.mjs app.mjs` instruments the app (`getting-started-node/javascript.mdx:93-96`) | **yes** |
| Init before any other module or "auto-instrumentation ... may not work" (`getting-started-node/javascript.mdx:55`) | **not needed** for Hapi: a first-line import is equivalent to `--import` |
| Verify snippet runs in "your main application file" (`getting-started-verify/javascript.hapi.mdx:7,13-19`) | **yes**: it creates the issue (`auto.function.hapi`, `handled: false`, `transaction: GET /debug-sentry`, request data present) |
| Tracing verify snippet (`getting-started-verify/javascript.hapi.mdx:40-55`) | **yes**; the span is a `test` child in a `span` envelope, there is no transaction |
| `NODE_OPTIONS="--import ./instrument.mjs"` alternative (`install/esm.mdx:44-48`) | **yes** |
| Direct import loses framework data (`install/esm-without-import.mdx:28-30`) | **no** for Hapi: spans, route names and errors are all captured |
| `@sentry/node/preload` late initialization (`install/late-initialization.mdx:37,68`, `Hapi` at `:115`) | **no**, subpath not exported |
| Errors captured without the handler (`v10-to-v11/index.mdx:715-720`) | **yes** with `--import`, `NODE_OPTIONS`, `--require`, CommonJS and a direct first-line import |
| `shouldHandleError` moved to `expressIntegration()` and `fastifyIntegration()` (`v10-to-v11/index.mdx:722`) | **incomplete**: `hapiIntegration({ shouldHandleError })` exists and is called; no docs page mentions it |
| Hapi integration "enabled by default when performance monitoring is enabled" (`integrations/hapi.mdx:19`) | **partial**: it is installed with and without tracing (23 of 23 integrations include `Hapi`) and captures errors without tracing |
| `hapiIntegration` is Tracing only, Errors column empty (`configuration/integrations/javascript.hapi.mdx:12`) | **no**, the integration is what captures Hapi errors (`auto.function.hapi`) |
| Spans come from `@opentelemetry/instrumentation-hapi` (`integrations/hapi.mdx:21`) | **no**, the package is not installed; the SDK's own diagnostics-channel instrumentation produced every span (`origin: auto.http.hapi`) |
| Supported versions `>=17.0.0 <22` (`integrations/hapi.mdx:31`) | **yes**, matches the build's `>=17.0.0 <22.0.0`; `21.4.10` fully instrumented (17 to 20 not run) |
| "what transactions are captured" (`guides/hapi/tracing/instrumentation/automatic-instrumentation.mdx:3`) | **no**, only `span` envelopes arrive under the default lifecycle |
| `router`/`handler` spans resolve a route, `router`/`middleware` ops (`v10-to-v11/index.mdx:391-392,439-440`) | **yes** |
| Boom errors reach Sentry | **only 500s**: `Boom.notFound` (404) and `Boom.serverUnavailable` (503) are never captured, and no docs page says which Hapi errors are captured |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **not tested**, only Node v26.5.0 was available |

## Files

`package.json`, `instrument.mjs`, `instrument.js`, `instrument-options.mjs`, `instrument-errors-only.mjs`,
`routes.mjs`, `routes.js`, `app.mjs`, `app.js`, `app-esm-tab.mjs`, `app-first-line.mjs`,
`app-first-line-no-handler.mjs`, `app-no-handler.mjs`, `app-verify-verbatim.mjs`, `app-late.mjs`, `run.sh`,
`summarize.mjs`, `sink.mjs` (a copy of `../koa/sink.mjs` that also records `sentry.segment.name.source` and the
`hapi.*` attributes), `results-<variant>.json`, `app-<variant>.log`, `sink-<variant>.log`.
