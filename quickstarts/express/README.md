# QS-express, Express getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
Express `4.22.2` at the root (the guide names no major, so 4 is the primary) and Express `5.2.1` in `express5/`
(only `express` lives there; `@sentry/node` resolves upward, so both majors share one SDK install).
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Node.js run in `../node/README.md` already covers the plain-Node install variants (`--import`, `--require`
banner, `NODE_OPTIONS`, first-line import) and a short Express library check (`probe-express.sh`,
`results-express-flag.json`, `results-express-self.json`). This run is the full Express guide; the Node-only
findings are cited, not repeated.

## What it reproduces

A new user following the Express guide end to end: install, write `instrument.(js|mjs)`, apply it the way each
tab says, add `Sentry.setupExpressErrorHandler(app)`, and run the verify step. One Express app with these routes:

| Route | What it does | Snippet |
| --- | --- | --- |
| `/debug-sentry` | `function mainHandler(req, res) { throw new Error("My first Sentry error!"); }` | `getting-started-verify/javascript.express.mdx:13-15`, verbatim |
| `/debug-sentry-tracing` | the async `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` handler that throws | `getting-started-verify/javascript.express.mdx:36-47`, verbatim except the path so both verify snippets share one server |
| `/users/:id` | `res.json({ id })`, a parameterized route for span naming | repro-only |
| `/error-404`, `/error-503` | `next(err)` with `status`/`statusCode` 404 and 503, for `shouldHandleError` defaults | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named `auditMiddleware` is registered first so middleware spans are visible. The readiness probe hits `/nope`
(unmatched route), which shows how an unrouted request is named.

## Which file each guide step renders from

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/express/index.mdx:12` `getting-started-node` | `platform-includes/getting-started-node/javascript.mdx` (no `javascript.express.mdx`; `javascript.express__v7.x.mdx` is v7 only) |
| `getting-started-node/javascript.mdx:1` prerequisites | `platform-includes/getting-started-prerequisites/javascript.node.mdx:1-16` |
| `getting-started-node/javascript.mdx:13` features expandable | `includes/quick-start-features-expandable.mdx:29-36` (Express row: issues, tracing, profiling, logs) |
| `getting-started-node/javascript.mdx:26` install | `platform-includes/getting-started-install/javascript.node.mdx:3-13` |
| `getting-started-node/javascript.mdx:45` config | `platform-includes/getting-started-config/javascript.node.mdx:1-35` (CommonJS `instrument.js`) and `:37-71` (ESM `instrument.mjs`) |
| `getting-started-node/javascript.mdx:76` apply (heading "CommonJS") | `platform-includes/getting-started-use/javascript.express.mdx:1-18` (CommonJS tab) and `:20-37` (ESM tab) |
| `getting-started-node/javascript.mdx:93-96` ESM | inline: `node --import ./instrument.mjs app.mjs` |
| `getting-started-node/javascript.mdx:102` capture errors | nothing: `platform-includes/getting-started-capture-errors/` has only hono, nestjs, solid, solidstart and no `javascript.mdx` or `_default.mdx` |
| `getting-started-node/javascript.mdx:106`, `:110` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `getting-started-node/javascript.mdx:116` verify | `platform-includes/getting-started-verify/javascript.express.mdx:12-16` (issues), `:35-48` (tracing), `:56-60` (logs, only under a `logs` onboarding option that `javascript.mdx:9-11` does not offer) |
| `getting-started-node/javascript.mdx:122` locate data | `includes/quick-start-locate-data-expandable.mdx:29-36` |
| `getting-started-node/javascript.mdx:61` install methods link | `docs/platforms/javascript/common/install/{index,esm,commonjs,esm-without-import,late-initialization}.mdx` (all list `javascript.express` as supported) |
| Express integration page | none: `docs/platforms/javascript/common/configuration/integrations/` has `connect`, `fastify`, `hapi`, `koa`, `nest` but no `express.mdx`, and there is no `guides/express/features/error-handler.mdx` (fastify and hono have one). `setupExpressErrorHandler`, `shouldHandleError` and `expressIntegration()` options are described only in `docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:713-748` and `:1375-1376` |
| `platform-includes/getting-started-add-top-level-import/javascript.express.mdx` | rendered by no page (no `includePath` references it) |

## Install

```bash
cd $REPRO/quickstarts/express
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus express@4
(cd express5 && npm install)   # express@5 only
```

## Run

```bash
cd $REPRO/quickstarts/express
./run.sh import               # node --import ./instrument.mjs app.mjs                    -> results-import.json
./run.sh cjs                  # node app.js  (require("./instrument") first line)          -> results-cjs.json
./run.sh esm-tab              # node app-esm-tab.mjs  (ESM tab verbatim, import "./instrument") -> results-esm-tab.json
./run.sh self-import          # node app-first-line.mjs  (import "./instrument.mjs" first line) -> results-self-import.json
./run.sh node-options         # NODE_OPTIONS="--import ./instrument.mjs" node app.mjs     -> results-node-options.json
./run.sh require-flag         # node --require ./instrument.js app.mjs                    -> results-require-flag.json
./run.sh no-handler           # --import, app without setupExpressErrorHandler            -> results-no-handler.json
./run.sh integration-options  # --import instrument-options.mjs (expressIntegration({ shouldHandleError })) -> results-integration-options.json
./run.sh late-init            # node --import @sentry/node/preload app-late.mjs           -> results-late-init.json
./run.sh express5             # node --import ./instrument.mjs express5/app.mjs           -> results-express5.json
./run.sh express5-no-handler  # express 5 without setupExpressErrorHandler                -> results-express5-no-handler.json
```

Each run starts the sink on `127.0.0.1:4716` and one app on `127.0.0.1:4717` (both checked free first), curls
the routes in order (`/users/42`, `/debug-sentry`, `/error-404`, `/error-503`, `/debug-log`,
`/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), polls `/__items` until the sentinel event, the
sentinel's server span and the log batch have all arrived, writes `results-<variant>.json` (steps with HTTP
codes, console output with the installed integrations, the compact sink items, the raw span payloads and a
computed verdict) via `summarize.mjs`, and kills both processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.node.mdx:3-5`: `npm install @sentry/node`.
- `getting-started-config/javascript.node.mdx:37-70`: create `instrument.mjs` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `getting-started-node/javascript.mdx:55`: import `instrument.js` before any other module or "auto-instrumentation ... may not work".
- `getting-started-use/javascript.express.mdx:1-18`: CommonJS, `require("./instrument");` first, then `Sentry.setupExpressErrorHandler(app)` "after all routes, but before any and other error-handling middlewares".
- `getting-started-use/javascript.express.mdx:20-37`: ESM, `import "./instrument";` first, same error handler call.
- `getting-started-node/javascript.mdx:93-96`: ESM, `node --import ./instrument.mjs app.mjs`.
- `getting-started-verify/javascript.express.mdx:13-15`: a route that throws creates an issue.
- `getting-started-verify/javascript.express.mdx:36-47`: "update the previous code snippet by starting a trace" with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` inside an `async` handler that throws.
- `install/esm.mdx:44-48`: `NODE_OPTIONS="--import ./instrument.mjs" npm run start` as an alternative.
- `install/esm-without-import.mdx:26-34`: a first-line import means "only native Node.js APIs can be instrumented ... will not capture data from ... framework-specific data".
- `install/late-initialization.mdx:37,68`: `node --require @sentry/node/preload app.js` / `node --import @sentry/node/preload app.js`, then `Sentry.init()` later; `:103-124` `SENTRY_PRELOAD_INTEGRATIONS="Http,Express"`.
- `migration/v10-to-v11/index.mdx:715`: framework errors are captured by the integrations now, `setupExpressErrorHandler(app)` is deprecated; `:746` by default 5xx errors and errors without a status are captured, 3xx and 4xx are not; `:735-743` `expressIntegration({ shouldHandleError })`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `express@4` succeeded (`added 133 packages in 5s`), `express5/`
(`added 68 packages`). `node_modules/@sentry` holds `bundler-plugins conventions core node opentelemetry
server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*`
entry except `@sentry/conventions@0.20.0` (a normal published dependency). **Holds.**

Exports the snippets use, checked in `node_modules/@sentry/node/build/types/index.d.ts` and
`node_modules/@sentry/server-utils/build/types/integrations/express/`:

| Export | Status on develop |
| --- | --- |
| `setupExpressErrorHandler(app)` | exists, `@deprecated` ("`expressIntegration()` now captures errors automatically ... will be removed in the next major version"), takes only `app`, no options argument |
| `expressErrorHandler()` | exists, `@deprecated` |
| `expressIntegration(options?: ExpressIntegrationOptions)` | exists; options `ignoreLayers`, `ignoreLayersType`, `shouldHandleError` (callback or `false`) |
| `@sentry/node/preload` | **does not exist**: the package `exports` are `. ./import ./vite ./rollup ./webpack ./esbuild` |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger.info` | exist |

### Step 2, Configure

`instrument.mjs` / `instrument.js` are the config snippets verbatim plus `tunnel` and `debug: true`.
`debug: true` prints no SDK name or version; identity was read off the envelopes: `sentry.javascript.node`
`10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** (the Node run's 45 plus `Mastra`):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

Every variant with debug on also prints `Sentry Logger [warn]: Discarded session because of missing or
non-string release` once; the guide's config sets no `release`.

### Step 3, Apply instrumentation (variant `import`, `results-import.json`)

Error event for `/debug-sentry` (HTTP 500 from Express's default handler after Sentry's):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.express","handled":false,
 "level":"error","sdk":"sentry.javascript.node","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4717/debug-sentry","method":"GET","hasData":false},"user":{"ip_address":"127.0.0.1"}}
```

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`); **no `transaction`
envelope was sent for any route in any variant**. Segment names come from the route
(`sentry.segment.name.source=route`, `http.route` set); the unmatched `/nope` probe is `GET` with `source=url`:

```
GET                         [source=url   status=error 404]   (readiness probe /nope)
GET /users/:id              [source=route status=ok    200]
GET /debug-sentry           [source=route status=error 500]
GET /error-404              [source=route status=error 404]
GET /error-503              [source=route status=error 503]
GET /debug-log              [source=route status=ok    200]
GET /debug-sentry-tracing   [source=route status=ok    200]   (express 4: no response was ever sent, see Step 4)
GET /sentinel               [source=route status=ok    200]
```

Child spans per request, all `origin: auto.http.express`: `middleware query`, `middleware expressInit`,
`middleware auditMiddleware`, `handler /users/:id` (and `handler /debug-sentry`, ...); the first request also
carries `middleware sentryRequestMiddleware`. Under v11 the ops are the bare `middleware` and `handler`
(`v10-to-v11/index.mdx:436-439`), not `middleware.express` / `request_handler.express`.

`/error-404` was **not** captured, `/error-503` was (`auto.http.express`), matching `v10-to-v11/index.mdx:746`.

Log item: `{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage`
event with `mechanism: generic`, `handled: true`, `transaction: GET /sentinel`.

### Step 4, Verify tracing snippet: express 4 hangs, express 5 works

`/debug-sentry-tracing` (the `async` handler from `getting-started-verify/javascript.express.mdx:36-47`):

| | express 4.22.2 (`results-import.json`) | express 5.2.1 (`results-express5.json`) |
| --- | --- | --- |
| HTTP response | none, curl gave up after 3 s (`http_code 000`, `curl_exit 28`) | 500 |
| error event | `mechanism: auto.node.onunhandledrejection`, `transaction: GET /debug-sentry-tracing` | `mechanism: auto.http.express`, same transaction |
| console | Node's "This error originated either by throwing inside of an async function without a catch block ..." warning, process stays up | none |
| `test` span | `My First Test Transaction`, `status: error`, child of the `GET /debug-sentry-tracing` segment, in a `span` envelope | same |
| segment | `status: ok`, `http.response.status_code: 200` although nothing was sent | `status: error`, 500 |

Express 4 does not forward a rejected handler promise to `next()`, so the snippet only works on Express 5. The
guide names no major, and `npm install express` today gives 5, but existing Express 4 apps hit the hang.

### Step 5, Manual setup variants (express 4)

`import`, `cjs`, `self-import`, `node-options`, `require-flag`, `no-handler` all produced **the same item
shapes**: 4 events, 8 `span` envelopes, 1 `log`, 46 integrations, route-named segments, middleware and handler
child spans, `/debug-sentry` captured with `auto.http.express`.

- **`esm-tab`** (`getting-started-use/javascript.express.mdx:22`, `import "./instrument";` verbatim): the app
  does not start, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/express/instrument'
  ... Did you mean to import "./instrument.js"?`. ESM resolution never probes extensions. The same extensionless
  import is at `install/esm-without-import.mdx:55`. `results-esm-tab.json`.
- **`cjs`** (`require("./instrument");` verbatim, `app.js`): works; `SDK initialized from CommonJS`.
- **`self-import`** (`import "./instrument.mjs";` first line, no flag): identical to `--import`, including every
  `middleware` and `handler` span and the `auto.http.express` error capture. `install/esm-without-import.mdx:28-30`
  says this method cannot capture "framework-specific data"; on develop it does (the Node run saw the same in
  `../node/README.md`, "Variant (b), library check"). `results-self-import.json`.
- **`node-options`**: identical to the flag.
- **`require-flag`** (`node --require ./instrument.js app.mjs`): works fully but prints the `[Sentry] Initializing
  the SDK via the Node --require flag is no longer supported ...` banner first (`app-require-flag.log:1`),
  already reported in `../node/README.md`.
- **`no-handler`** (no `setupExpressErrorHandler(app)` at all): `/debug-sentry` and `/error-503` captured
  exactly as with the handler (`auto.http.express`, `handled: false`), 404 skipped. The deprecated call adds
  nothing and prints no deprecation notice at runtime (`deprecation_output: []` in every results file).
- **`integration-options`** (`expressIntegration({ shouldHandleError(error) { return Number(error.statusCode ?? 500) >= 400 } })`,
  the `v10-to-v11/index.mdx:735-743` shape): 5 events, `/error-404` now captured too. `results-integration-options.json`.
- **`late-init`** (`node --import @sentry/node/preload app-late.mjs`, `install/late-initialization.mdx:68`):
  the app does not start, `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './preload' is not defined by
  "exports" in $REPRO/quickstarts/express/node_modules/@sentry/node/package.json`. `v10-to-v11/index.mdx:1359`
  says the `preload` entry point was removed from every server SDK. `results-late-init.json`.
- **`express5`**, **`express5-no-handler`**: same shapes as express 4 except the tracing route (Step 4).

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` is all you need (`getting-started-install/javascript.node.mdx:3-5`) | **yes** |
| `instrument.mjs` snippet initializes the SDK (`getting-started-config/javascript.node.mdx:37-70`) | **yes** |
| CommonJS tab, `require("./instrument")` then `setupExpressErrorHandler(app)` (`getting-started-use/javascript.express.mdx:1-18`) | **yes**, but the handler call is deprecated and unnecessary |
| ESM tab, `import "./instrument";` (`getting-started-use/javascript.express.mdx:20-37`) | **no**, `ERR_MODULE_NOT_FOUND`; works with `./instrument.mjs` |
| `node --import ./instrument.mjs app.mjs` instruments the app (`getting-started-node/javascript.mdx:93-96`) | **yes** |
| Init before any other module or "auto-instrumentation ... may not work" (`getting-started-node/javascript.mdx:55`) | **partial**, a first-line import is equivalent for Express on develop |
| `/debug-sentry` throw creates an issue (`getting-started-verify/javascript.express.mdx:13-15`) | **yes**, `auto.http.express`, `handled: false`, `transaction: GET /debug-sentry`, request data present |
| Tracing verify snippet (`getting-started-verify/javascript.express.mdx:36-47`) | **partial**, express 5 only; express 4 hangs the request and reports an unhandled rejection; the span is a `test` child in a `span` envelope, there is no transaction |
| `NODE_OPTIONS="--import ./instrument.mjs"` alternative (`install/esm.mdx:44-48`) | **yes** |
| Direct import loses framework data (`install/esm-without-import.mdx:28-30`) | **no** for Express on develop |
| `@sentry/node/preload` late initialization (`install/late-initialization.mdx:37,68`) | **no**, subpath not exported |
| Errors captured without the handler, 5xx only by default (`v10-to-v11/index.mdx:715,746`) | **yes** |
| `expressIntegration({ shouldHandleError })` (`v10-to-v11/index.mdx:735-743`) | **yes** |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **not tested**, only Node v26.5.0 was available |

## Files

`package.json`, `express5/package.json`, `instrument.mjs`, `instrument.js`, `instrument-options.mjs`, `routes.mjs`,
`routes.js`, `app.mjs`, `app.js`, `app-esm-tab.mjs`, `app-first-line.mjs`, `app-no-handler.mjs`, `app-late.mjs`,
`express5/app.mjs`, `express5/app-no-handler.mjs`, `run.sh`, `summarize.mjs`, `sink.mjs` (a copy of
`../node/sink.mjs` extended with `sentry.segment.name`, `http.response.status_code`, the envelope SDK name,
event `level` and mechanism data), `results-<variant>.json`, `app-<variant>.log`, `sink-<variant>.log`.
