# QS-koa, Koa getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
Koa `3.2.1` and `@koa/router` `15.7.0` from the registry (the guide names no major for either; `npm install koa`
gives 3, the integration page lists `koa: ^2.0.0`). All envelopes go to a local sink via the `tunnel` option;
nothing leaves the machine.

The Node.js run in `../node/README.md` covers the plain-Node install variants, the Express run in
`../express/README.md` and the Fastify run in `../fastify/README.md` cover the same guide skeleton for those
frameworks. Findings that are Node-only (the `--require` banner, the removed `@sentry/node/preload` entry, the
extensionless ESM import, the missing-release session warning) are cited from there and only their Koa status
is recorded here.

## What it reproduces

A new user following the Koa guide end to end: install, write `instrument.(js|mjs)`, apply it the way each tab
says, call `Sentry.setupKoaErrorHandler(app)`, and run the verify step. One Koa app with one `@koa/router` and
these routes:

| Route | What it does | Snippet |
| --- | --- | --- |
| `/debug-sentry` | `router.get("/debug-sentry", function () { throw new Error("My first Sentry error!"); });` | `getting-started-verify/javascript.koa.mdx:13-15`, verbatim |
| `/debug-sentry-tracing` | the `async (ctx)` handler with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` that throws | `getting-started-verify/javascript.koa.mdx:35-46`, verbatim except the path so both verify snippets share one server |
| `/users/:id` | `ctx.body = { id: ctx.params.id }`, a parameterized route for span naming | repro-only |
| `/error-404`, `/error-503` | `ctx.throw(404, "custom 404")` (and 503), to see which HTTP errors Koa hands to Sentry | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named plain middleware (`auditMiddleware`) is registered before the router so middleware spans are visible;
`router.routes()` and `router.allowedMethods()` follow. The readiness probe hits `/nope` (unmatched route),
which shows how an unrouted request is named.

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.koa`), then
`fallbackGuide` (`javascript.node`, from `guides/koa/index.mdx:5`), then platform (`javascript`), then `_default`.
Only three includes have a `javascript.koa.mdx`: `getting-started-use`, `getting-started-verify` and
`getting-started-add-top-level-import`.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/koa/index.mdx:12` `getting-started-node` | `platform-includes/getting-started-node/javascript.mdx` (no koa or node file) |
| `getting-started-node/javascript.mdx:1` prerequisites | `platform-includes/getting-started-prerequisites/javascript.node.mdx:1-16` |
| `getting-started-node/javascript.mdx:13` features expandable | `includes/quick-start-features-expandable.mdx:29-36` (Koa listed in the server row) |
| `getting-started-node/javascript.mdx:26` install | `platform-includes/getting-started-install/javascript.node.mdx:3-13` (`@sentry/node` only, no `@koa/router`) |
| `getting-started-node/javascript.mdx:45` config | `platform-includes/getting-started-config/javascript.node.mdx:1-35` (CommonJS `instrument.js`) and `:37-71` (ESM `instrument.mjs`) |
| `getting-started-node/javascript.mdx:76` apply (heading "CommonJS") | `platform-includes/getting-started-use/javascript.koa.mdx:1-16` (CommonJS tab) and `:18-33` (ESM tab) |
| `getting-started-node/javascript.mdx:93-96` ESM | inline: `node --import ./instrument.mjs app.mjs` |
| `getting-started-node/javascript.mdx:102` capture errors | nothing: `platform-includes/getting-started-capture-errors/` has no `javascript.koa.mdx`, `javascript.node.mdx`, `javascript.mdx` or `_default.mdx` |
| `getting-started-node/javascript.mdx:106`, `:110` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `getting-started-node/javascript.mdx:116` verify | `platform-includes/getting-started-verify/javascript.koa.mdx:12-16` (issues), `:34-47` (tracing), `:55-59` (logs, only under a `logs` onboarding option that `javascript.mdx:9-11` does not offer) |
| `getting-started-node/javascript.mdx:122` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| `getting-started-node/javascript.mdx:61` install methods link | `docs/platforms/javascript/common/install/{index,esm,commonjs,esm-without-import,late-initialization}.mdx` (all list `javascript.koa` at `:12`) |
| Koa integration page | `docs/platforms/javascript/common/configuration/integrations/koa.mdx:1-55` (no includes) |
| Koa automatic instrumentation page | `docs/platforms/javascript/guides/koa/tracing/instrumentation/automatic-instrumentation.mdx:6` -> `includes/node-automatic-instrumentation.mdx` (no Koa mention) |
| `platform-includes/getting-started-add-top-level-import/javascript.koa.mdx` | rendered by no page (no `includePath` references it); it is the only Koa snippet that imports `@koa/router` and creates `router` |

## Install

```bash
cd $REPRO/quickstarts/koa
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus koa@3 and @koa/router@15
```

## Run

```bash
cd $REPRO/quickstarts/koa
./run.sh import                  # node --import ./instrument.mjs app.mjs                        -> results-import.json
./run.sh cjs                     # node app.js  (require("./instrument") first line)              -> results-cjs.json
./run.sh esm-tab                 # node app-esm-tab.mjs  (ESM tab verbatim, import "./instrument") -> results-esm-tab.json
./run.sh self-import             # node app-first-line.mjs  (import "./instrument.mjs" first line) -> results-self-import.json
./run.sh self-import-no-handler  # same, without setupKoaErrorHandler                            -> results-self-import-no-handler.json
./run.sh node-options            # NODE_OPTIONS="--import ./instrument.mjs" node app.mjs         -> results-node-options.json
./run.sh require-flag            # node --require ./instrument.js app.mjs                        -> results-require-flag.json
./run.sh no-handler              # --import, app without setupKoaErrorHandler                    -> results-no-handler.json
./run.sh integration-options     # --import instrument-options.mjs (koaIntegration({ ignoreLayersType: ['middleware'] })) -> results-integration-options.json
./run.sh errors-only             # --import instrument-errors-only.mjs (no tracesSampleRate)     -> results-errors-only.json
./run.sh errors-only-no-handler  # same, app without setupKoaErrorHandler                        -> results-errors-only-no-handler.json
./run.sh verify-verbatim         # node app-verify-verbatim.mjs (verify snippet pasted into the guide app, no router) -> results-verify-verbatim.json
./run.sh top-level-import        # node app-top-level-import.mjs (unrendered add-top-level-import include, import './instrument.js') -> results-top-level-import.json
./run.sh late-init               # node --import @sentry/node/preload app-late.mjs               -> results-late-init.json
```

Each run starts the sink on `127.0.0.1:4721` and one app on `127.0.0.1:4722` (both checked free first), curls
the routes in order (`/users/42`, `/debug-sentry`, `/error-404`, `/error-503`, `/debug-log`,
`/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), polls `/__items` until the sentinel event, the
sentinel's server span (skipped for the `errors-only*` variants, which send no spans) and the log batch have all
arrived (hard deadline 60 s, no fixed sleeps), writes `results-<variant>.json` (steps with HTTP codes, console
output with the installed integrations, the compact sink items, the raw span payloads and a computed verdict)
via `summarize.mjs`, and kills both processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.node.mdx:3-5`: `npm install @sentry/node`.
- `getting-started-config/javascript.node.mdx:37-70`: create `instrument.mjs` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `getting-started-node/javascript.mdx:55`: import `instrument.js` before any other module or "auto-instrumentation ... may not work".
- `getting-started-use/javascript.koa.mdx:1-16`: CommonJS, `require("./instrument");` first, `Sentry.setupKoaErrorHandler(app)` right after `new Koa()`, before the routes.
- `getting-started-use/javascript.koa.mdx:18-33`: ESM, `import "./instrument";` first, same error handler call.
- `getting-started-node/javascript.mdx:88-96`: ESM, `node --import ./instrument.mjs app.mjs`.
- `getting-started-verify/javascript.koa.mdx:7,13-15`: "Add the following code snippet to your main application file; it defines a route", `router.get("/debug-sentry", ...)` throws and creates an issue.
- `getting-started-verify/javascript.koa.mdx:29,35-46`: "update the previous code snippet by starting a trace" with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` inside an `async (ctx)` handler that throws.
- `install/esm.mdx:44-48`: `NODE_OPTIONS="--import ./instrument.mjs" npm run start` as an alternative.
- `install/esm-without-import.mdx:26-34`: a first-line import means "only native Node.js APIs can be instrumented ... will not capture data from ... framework-specific data".
- `install/late-initialization.mdx:37,68`: `node --require @sentry/node/preload app.js` / `node --import @sentry/node/preload app.js`, then `Sentry.init()` later; `:103-124` `SENTRY_PRELOAD_INTEGRATIONS` with `Koa` at `:116`.
- `integrations/koa.mdx:3`: "Adds performance instrumentation for Koa. (default)"; `:17-21` `Sentry.koaIntegration`, "enabled by default when performance monitoring is enabled", "adds instrumentation for the Koa framework to capture spans using `@opentelemetry/instrumentation-koa`"; `:31-50` option `ignoreLayersType: Array<'middleware' | 'router'>`; `:52-55` supported versions `koa: ^2.0.0`, `@koa/router: >=8`.
- `guides/koa/tracing/instrumentation/automatic-instrumentation.mdx:3`: "Learn what transactions are captured after tracing is enabled in the Sentry Koa SDK."
- `migration/v10-to-v11/index.mdx:715-719`: Koa errors are captured by the integration, `setupKoaErrorHandler(app)` is deprecated; `:722` `shouldHandleError` moved to `expressIntegration()` and `fastifyIntegration()` (Koa not listed); `:391` "Only the Express, Koa, and Hapi integrations resolve a route for `router` spans"; `:436-439` `handler`, `middleware` and `router` ops.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `koa@3` and `@koa/router@15` succeeded (`added 97 packages in
11s`). `node_modules/@sentry` holds `bundler-plugins conventions core node opentelemetry
server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*`
entry except `@sentry/conventions@0.20.0` (a normal published dependency). **Holds.** The guide never says to
install `@koa/router`, although its verify snippet needs one (Step 4).

Exports the snippets use, checked in `node_modules/@sentry/node/build/types/index.d.ts:5,8`,
`node_modules/@sentry/node/build/types/integrations/tracing/koa.d.ts` and
`node_modules/@sentry/server-utils/build/types/integrations/koa/index.d.ts`:

| Export | Status on develop |
| --- | --- |
| `setupKoaErrorHandler(app)` | exists, `@deprecated` ("The error handler is now registered automatically when the Koa app starts (via the orchestrion `koa` instrumentation), so calling this is no longer necessary. It remains a safe, idempotent operation, and is kept for setups where auto-registration is unavailable"); one parameter; delegates to `attachKoaErrorHandler`, which adds one `app.on('error')` listener (`build/esm/integrations/koa/koa-error-handler.js`) |
| `koaIntegration(options?)` | exists; the only option is `ignoreLayersType?: Array<'middleware' \| 'router'>`; d.ts: "Diagnostics-channel-based koa integration ... Requires the Sentry runtime hook or bundler plugin" |
| `koaIntegration({ shouldHandleError })` | no such option (the migration page lists it for Express and Fastify only) |
| `@opentelemetry/instrumentation-koa` (`integrations/koa.mdx:21`) | **not installed**: not a dependency of `@sentry/node` or `@sentry/server-utils`, no `node_modules/@opentelemetry/*koa*`; the build subscribes to the `orchestrion:koa:use` and `orchestrion:koa:callback` channels injected into `koa/lib/application.js` (`versionRange: '>=2.0.0 <4'`) |
| `@sentry/node/preload` | **does not exist**: the package `exports` are `. ./import ./vite ./rollup ./webpack ./esbuild` (see `../express/README.md`) |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger.info` | exist |

### Step 2, Configure

`instrument.mjs` / `instrument.js` are the config snippets verbatim plus `tunnel` and `debug: true`.
`debug: true` prints no SDK name or version; identity was read off the envelopes: `sentry.javascript.node`
`10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** with `tracesSampleRate: 1.0` (identical to the
Express and Fastify runs):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

With the "error-monitoring" option only (no `tracesSampleRate`, `errors-only`), **23 integrations**, and `Koa` is
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
(`../node/README.md`). No deprecation notice is printed for `setupKoaErrorHandler` at runtime
(`deprecation_output: []` in every variant).

### Step 3, Apply instrumentation (variant `import`, `results-import.json`)

Error event for `/debug-sentry` (HTTP 500 from Koa's default `ctx.onerror`):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.middleware.koa","handled":false,
 "level":"error","sdk":"sentry.javascript.node","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4722/debug-sentry","method":"GET","hasData":false,"headers":{"host":"127.0.0.1:4722","user-agent":"curl/8.7.1","accept":"*/*"}},
 "user":{"ip_address":"127.0.0.1"},"environment":"production"}
```

**Five** error events per run, not the three the routes suggest: `ctx.throw(404, "custom 404")` and
`ctx.throw(503, "custom 503")` both arrive as `NotFoundError: custom 404` / `ServiceUnavailableError: custom 503`
with `mechanism: auto.middleware.koa`, `handled: false`. Koa emits its `error` event for every request error and
the SDK's listener captures all of them; there is no status filter and no option to add one (the Express and
Fastify `shouldHandleError` has no Koa counterpart). No error was captured twice (`duplicate_error_events: []`).

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle:
stream` on every span); **no `transaction` envelope was sent for any route in any variant**. Segment names come
from the matched route (`sentry.segment.name.source=route`, `http.route` set, op `http.server`, origin
`auto.http.http_server`); the unmatched `/nope` probe is `GET` with `source=url`:

```
GET                         [source=url   status=error 404]   (readiness probe /nope)
GET /users/:id              [source=route status=ok    200]
GET /debug-sentry           [source=route status=error 500]
GET /error-404              [source=route status=error 404]
GET /error-503              [source=route status=error 503]
GET /debug-log              [source=route status=ok    200]
GET /debug-sentry-tracing   [source=route status=error 500]
GET /sentinel               [source=route status=ok    200]
```

Child spans per request, all `origin: auto.http.koa`: `middleware auditMiddleware` (op `middleware`, `koa.type:
middleware`, `koa.name` and `code.function.name: auditMiddleware`) and one `router` span named by the bare route
path (`router /users/:id`, with `koa.type: router`, `koa.name` and `http.route: /users/:id`), matching
`v10-to-v11/index.mdx:391,438-439`. The unmatched `/nope` probe additionally gets a span named `middleware`
(`koa.name` and `code.function.name: middleware`): the `router.allowedMethods()` layer is an anonymous arrow
function (`@koa/router/dist/index.mjs:1153-1155`), and it only runs when no route matched because the routed
handlers never call `next()`. There is no `handler` span for Koa.

Log item: `{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage`
event with `mechanism: generic`, `handled: true`, `transaction: GET /sentinel`.

### Step 4, Verify: the snippet does not run as the guide presents it, then works once a router exists

`getting-started-verify/javascript.koa.mdx:7` says to add `router.get("/debug-sentry", ...)` "to your main
application file". The guide's application file (`getting-started-use/javascript.koa.mdx:18-33`) never creates a
`router` and the install step never installs `@koa/router`. Pasting the snippet where "Add your routes, etc."
sits (`app-verify-verbatim.mjs`, `results-verify-verbatim.json`): `ReferenceError: router is not defined` at
`app-verify-verbatim.mjs:16:1`, the SDK captures it as `auto.node.onuncaughtexception` (`handled: false`) and
the process exits before listening. The only Koa snippet that imports `@koa/router` and creates the `router` is
`getting-started-add-top-level-import/javascript.koa.mdx:19-35`, which no page renders.

With a router (`routes.mjs`), `/debug-sentry` gives the event above. `/debug-sentry-tracing`
(`getting-started-verify/javascript.koa.mdx:35-46`): HTTP 500 after ~104 ms, error event
`mechanism: auto.middleware.koa`, `handled: false`, `transaction: GET /debug-sentry-tracing`, plus a `test` span
`My First Test Transaction` (`status: error`, `origin: manual`) as a child of the `GET /debug-sentry-tracing`
segment, inside a `span` envelope. Koa forwards the rejected handler promise to `ctx.onerror`, so unlike Express 4
(`../express/README.md`, Step 4) nothing hangs. The span is named "My First Test Transaction" but there is no
transaction anywhere in the sink; the page text ("starting a trace") and the automatic instrumentation page
("what transactions are captured") do not say that.

### Step 5, Manual setup variants

`import`, `cjs`, `node-options`, `require-flag`, `no-handler` all produced **the same item shapes**: 5 events,
8 `span` envelopes, 1 `log`, 46 integrations, route-named segments, `middleware` and `router` child spans,
`/debug-sentry` captured with `auto.middleware.koa`.

- **`esm-tab`** (`getting-started-use/javascript.koa.mdx:20`, `import "./instrument";` verbatim): the app
  does not start, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/koa/instrument'
  imported from $REPRO/quickstarts/koa/app-esm-tab.mjs ... Did you mean to import "./instrument.js"?`. Same
  extensionless import as the Express and Fastify tabs and `install/esm-without-import.mdx:55`.
  `results-esm-tab.json`.
- **`cjs`** (`require("./instrument");` verbatim, `app.js`): works; `SDK initialized from CommonJS`.
- **`self-import`** (`import "./instrument.mjs";` first line, no flag, the ESM tab with its extension fixed):
  **degraded**. Errors arrive (5 events, `auto.middleware.koa`), but every segment is named `GET` with
  `sentry.segment.name.source: url` and no `http.route`, and the only child span is the manual `test` span: no
  `router` or `middleware` span at all. The `koa` module is already loaded when `Sentry.init` registers the
  runtime hook, so the `orchestrion:koa:use` and `:callback` channels never fire. `install/esm-without-import.mdx:28-30`
  is right for Koa (it is not for Fastify, `../fastify/README.md`). `results-self-import.json`.
- **`self-import-no-handler`** (same, without `setupKoaErrorHandler(app)`): **no Koa error is captured**. The
  sink holds 1 event (the sentinel); `/debug-sentry`, `/error-503` and the tracing route are only printed by
  Koa's default error listener on stderr (`  Error: My first Sentry error!` three times). Because the `callback`
  channel does not fire, the error listener is never auto-registered, so under the direct-import method the
  deprecated call is the only thing that captures Koa errors. `results-self-import-no-handler.json`.
- **`top-level-import`** (`getting-started-add-top-level-import/javascript.koa.mdx:19-35`, `import './instrument.js'`
  first line, which loads the CommonJS `instrument.js`): same as `self-import` (5 events, `GET`/`url` segments,
  no Koa spans). `results-top-level-import.json`.
- **`node-options`**: identical to the flag.
- **`require-flag`** (`node --require ./instrument.js app.mjs`): works fully but prints `[Sentry] Initializing
  the SDK via the Node \`--require\` flag is no longer supported ...` first, already reported in
  `../node/README.md`.
- **`no-handler`** (no `setupKoaErrorHandler(app)` at all, `--import`): the same 5 events, `auto.middleware.koa`,
  `handled: false`. Difference to `import`: Koa's default error logging is **present** here (3 stderr blocks,
  `koa_default_error_log: 3`) and **absent** with the guide's snippet (`koa_default_error_log: 0` in `import`,
  `cjs`, `node-options`, `require-flag`, `self-import`, `errors-only`). Koa installs its default `error`
  listener inside `callback()` only when no listener exists yet; the guide calls `setupKoaErrorHandler(app)`
  before `app.listen()`, which adds the Sentry listener first and silently turns Koa's stderr logging off. The
  auto-registration deliberately runs after `callback()` to avoid exactly that (`orchestrion/config/koa` comment).
  `results-no-handler.json`.
- **`integration-options`** (`koaIntegration({ ignoreLayersType: ['middleware'] })`, `integrations/koa.mdx:39-50`,
  on the no-handler app): the `middleware` spans are gone, the `router` spans and everything else unchanged.
  `results-integration-options.json`.
- **`errors-only`** / **`errors-only-no-handler`** (config without `tracesSampleRate`): 23 integrations, 0 `span`
  envelopes, the same 5 events with `auto.middleware.koa` and `transaction: GET /debug-sentry`, with and without
  the handler call. The Koa integration is installed and registers the error listener without tracing.
  `results-errors-only.json`, `results-errors-only-no-handler.json`.
- **`verify-verbatim`**: see Step 4. `results-verify-verbatim.json`.
- **`late-init`** (`node --import @sentry/node/preload app-late.mjs`, `install/late-initialization.mdx:68`):
  the app does not start, `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './preload' is not defined by
  "exports" in $REPRO/quickstarts/koa/node_modules/@sentry/node/package.json`, as in `../express/README.md`.
  `results-late-init.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` is all you need (`getting-started-install/javascript.node.mdx:3-5`) | **partial**, the verify snippet also needs `@koa/router`, which no step installs |
| `instrument.mjs` snippet initializes the SDK (`getting-started-config/javascript.node.mdx:37-70`) | **yes** |
| CommonJS tab, `require("./instrument")` then `setupKoaErrorHandler(app)` (`getting-started-use/javascript.koa.mdx:1-16`) | **yes**, but the handler call is deprecated and turns off Koa's default stderr error logging |
| ESM tab, `import "./instrument";` (`getting-started-use/javascript.koa.mdx:18-33`) | **no**, `ERR_MODULE_NOT_FOUND`; with `./instrument.mjs` it starts but loses every Koa span and route name |
| `node --import ./instrument.mjs app.mjs` instruments the app (`getting-started-node/javascript.mdx:93-96`) | **yes** |
| Init before any other module or "auto-instrumentation ... may not work" (`getting-started-node/javascript.mdx:55`) | **yes** for Koa: a first-line import is not equivalent to `--import` |
| Verify snippet runs in "your main application file" (`getting-started-verify/javascript.koa.mdx:7,13-15`) | **no**, `ReferenceError: router is not defined`; with a `@koa/router` it creates the issue (`auto.middleware.koa`, `handled: false`, `transaction: GET /debug-sentry`, request data present) |
| Tracing verify snippet (`getting-started-verify/javascript.koa.mdx:35-46`) | **yes** (given a router); the span is a `test` child in a `span` envelope, there is no transaction |
| `NODE_OPTIONS="--import ./instrument.mjs"` alternative (`install/esm.mdx:44-48`) | **yes** |
| Direct import loses framework data (`install/esm-without-import.mdx:28-30`) | **yes** for Koa, and it also loses Koa error capture unless the deprecated `setupKoaErrorHandler(app)` stays |
| `@sentry/node/preload` late initialization (`install/late-initialization.mdx:37,68`, `Koa` at `:116`) | **no**, subpath not exported |
| Errors captured without the handler (`v10-to-v11/index.mdx:715-719`) | **yes** with `--import`, `NODE_OPTIONS`, `--require` and CommonJS; **no** with a direct first-line import |
| Koa integration "enabled by default when performance monitoring is enabled" (`integrations/koa.mdx:19`) | **partial**: it is installed with and without tracing (23 of 23 integrations include `Koa`) and captures errors without tracing |
| Spans come from `@opentelemetry/instrumentation-koa` (`integrations/koa.mdx:21`) | **no**, the package is not installed; the SDK's own diagnostics-channel instrumentation produced every span (`origin: auto.http.koa`) |
| `ignoreLayersType: ['middleware']` drops middleware spans (`integrations/koa.mdx:31-50`) | **yes** |
| Supported versions `koa: ^2.0.0`, `@koa/router: >=8` (`integrations/koa.mdx:54-55`) | **stale** for koa: `3.2.1` is fully instrumented and the build's range is `>=2.0.0 <4` (koa 2 not run here) |
| "what transactions are captured" (`guides/koa/tracing/instrumentation/automatic-instrumentation.mdx:3`) | **no**, only `span` envelopes arrive under the default lifecycle |
| `router` spans resolve a route, `middleware`/`router` ops (`v10-to-v11/index.mdx:391,438-439`) | **yes** |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **not tested**, only Node v26.5.0 was available |

## Files

`package.json`, `instrument.mjs`, `instrument.js`, `instrument-options.mjs`, `instrument-errors-only.mjs`,
`routes.mjs`, `routes.js`, `app.mjs`, `app.js`, `app-esm-tab.mjs`, `app-first-line.mjs`,
`app-first-line-no-handler.mjs`, `app-no-handler.mjs`, `app-verify-verbatim.mjs`, `app-top-level-import.mjs`,
`app-late.mjs`, `run.sh`, `summarize.mjs`, `sink.mjs` (a copy of `../fastify/sink.mjs`), `results-<variant>.json`,
`app-<variant>.log`, `sink-<variant>.log`.
