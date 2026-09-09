# QS-fastify, Fastify getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
Fastify `5.12.3` at the root (the guide names no major, `npm install fastify` gives 5) and Fastify `4.29.1` in
`fastify4/` (only `fastify` lives there; `@sentry/node` resolves upward, so both majors share one SDK install).
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Node.js run in `../node/README.md` covers the plain-Node install variants and the Express run in
`../express/README.md` covers the same guide skeleton for Express. Findings that are Node-only (the `--require`
banner, the removed `@sentry/node/preload` entry, the extensionless ESM import) are cited from there and only
their Fastify status is recorded here.

## What it reproduces

A new user following the Fastify guide end to end: install, write `instrument.(js|mjs)`, apply it the way each
tab says, call `Sentry.setupFastifyErrorHandler(app)`, and run the verify step. One Fastify app with these routes:

| Route | What it does | Snippet |
| --- | --- | --- |
| `/debug-sentry` | `function mainHandler(req, res) { throw new Error("My first Sentry error!"); }` | `getting-started-verify/javascript.fastify.mdx:13-15`, verbatim |
| `/debug-sentry-tracing` | the async `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` handler that throws | `getting-started-verify/javascript.fastify.mdx:36-47`, verbatim except the path so both verify snippets share one server |
| `/users/:id` | `async (request) => ({ id: request.params.id })`, a parameterized route for span naming | repro-only |
| `/error-404`, `/error-503` | `throw Object.assign(new Error("custom 404"), { statusCode: 404 })` (and 503), for the `shouldHandleError` default | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named `onRequest` hook (`auditHook`) is registered first so instance-hook spans are visible. The readiness probe
hits `/nope` (unmatched route), which shows how an unrouted request is named.

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.fastify`), then
`fallbackGuide` (`javascript.node`, from `guides/fastify/index.mdx:5`), then platform (`javascript`), then `_default`.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/fastify/index.mdx:12` `getting-started-primer` | `platform-includes/getting-started-primer/_default.mdx` (empty file) |
| `docs/platforms/javascript/guides/fastify/index.mdx:14` `getting-started-node` | `platform-includes/getting-started-node/javascript.mdx` (no fastify or node file) |
| `getting-started-node/javascript.mdx:1` prerequisites | `platform-includes/getting-started-prerequisites/javascript.node.mdx:1-16` |
| `getting-started-node/javascript.mdx:13` features expandable | `includes/quick-start-features-expandable.mdx:29-36` (Fastify listed in the server row) |
| `getting-started-node/javascript.mdx:26` install | `platform-includes/getting-started-install/javascript.node.mdx:3-13` |
| `getting-started-node/javascript.mdx:45` config | `platform-includes/getting-started-config/javascript.node.mdx:1-35` (CommonJS `instrument.js`) and `:37-71` (ESM `instrument.mjs`) |
| `getting-started-node/javascript.mdx:76` apply (heading "CommonJS") | `platform-includes/getting-started-use/javascript.fastify.mdx:1-16` (CommonJS tab) and `:18-33` (ESM tab) |
| `getting-started-node/javascript.mdx:93-96` ESM | inline: `node --import ./instrument.mjs app.mjs` |
| `getting-started-node/javascript.mdx:102` capture errors | nothing: `platform-includes/getting-started-capture-errors/` has no `javascript.fastify.mdx`, `javascript.node.mdx`, `javascript.mdx` or `_default.mdx` |
| `getting-started-node/javascript.mdx:106`, `:110` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `getting-started-node/javascript.mdx:116` verify | `platform-includes/getting-started-verify/javascript.fastify.mdx:12-16` (issues), `:35-48` (tracing), `:56-60` (logs, only under a `logs` onboarding option that `javascript.mdx:9-11` does not offer) |
| `getting-started-node/javascript.mdx:122` locate data | `includes/quick-start-locate-data-expandable.mdx:29-36` |
| `getting-started-node/javascript.mdx:61` install methods link | `docs/platforms/javascript/common/install/{index,esm,commonjs,esm-without-import,late-initialization}.mdx` (all list `javascript.fastify` at `:9`) |
| Fastify integration page | `docs/platforms/javascript/common/configuration/integrations/fastify.mdx:1-31` (no includes) |
| Fastify error handler page | `docs/platforms/javascript/guides/fastify/features/error-handler.mdx:1-63` (reached from `guides/fastify/features/index.mdx` `PageGrid`) |
| Fastify automatic instrumentation page | `docs/platforms/javascript/guides/fastify/tracing/instrumentation/automatic-instrumentation.mdx:6` -> `includes/node-automatic-instrumentation.mdx` (no Fastify mention) |
| `platform-includes/getting-started-add-top-level-import/javascript.fastify.mdx` | rendered by no page (no `includePath` references it); it is the only Fastify snippet with a resolvable `import './instrument.js'` |

## Install

```bash
cd $REPRO/quickstarts/fastify
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus fastify@5
(cd fastify4 && npm install)   # fastify@4 only
```

## Run

```bash
cd $REPRO/quickstarts/fastify
./run.sh import               # node --import ./instrument.mjs app.mjs                    -> results-import.json
./run.sh cjs                  # node app.js  (require("./instrument") first line)          -> results-cjs.json
./run.sh esm-tab              # node app-esm-tab.mjs  (ESM tab verbatim, import "./instrument") -> results-esm-tab.json
./run.sh self-import          # node app-first-line.mjs  (import "./instrument.mjs" first line) -> results-self-import.json
./run.sh node-options         # NODE_OPTIONS="--import ./instrument.mjs" node app.mjs     -> results-node-options.json
./run.sh require-flag         # node --require ./instrument.js app.mjs                    -> results-require-flag.json
./run.sh no-handler           # --import, app without setupFastifyErrorHandler            -> results-no-handler.json
./run.sh handler-options      # --import, setupFastifyErrorHandler(app, { shouldHandleError }) (error-handler page) -> results-handler-options.json
./run.sh integration-options  # --import instrument-options.mjs (fastifyIntegration({ shouldHandleError })) -> results-integration-options.json
./run.sh error-handler-page   # node app-error-handler-page.mjs (error-handler page snippet verbatim) -> results-error-handler-page.json
./run.sh late-init            # node --import @sentry/node/preload app-late.mjs           -> results-late-init.json
./run.sh fastify4             # node --import ./instrument.mjs fastify4/app.mjs           -> results-fastify4.json
./run.sh fastify4-no-handler  # fastify 4 without setupFastifyErrorHandler                -> results-fastify4-no-handler.json
```

Each run starts the sink on `127.0.0.1:4718` and one app on `127.0.0.1:4719` (both checked free first), curls
the routes in order (`/users/42`, `/debug-sentry`, `/error-404`, `/error-503`, `/debug-log`,
`/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), polls `/__items` until the sentinel event, the
sentinel's server span and the log batch have all arrived, writes `results-<variant>.json` (steps with HTTP
codes, console output with the installed integrations, the compact sink items, the raw span payloads and a
computed verdict) via `summarize.mjs`, and kills both processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.node.mdx:3-5`: `npm install @sentry/node`.
- `getting-started-config/javascript.node.mdx:37-70`: create `instrument.mjs` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `getting-started-node/javascript.mdx:55`: import `instrument.js` before any other module or "auto-instrumentation ... may not work".
- `getting-started-use/javascript.fastify.mdx:1-16`: CommonJS, `require("./instrument");` first, `Sentry.setupFastifyErrorHandler(app)` right after `Fastify()`, before the routes.
- `getting-started-use/javascript.fastify.mdx:18-33`: ESM, `import "./instrument";` first, same error handler call.
- `getting-started-node/javascript.mdx:93-96`: ESM, `node --import ./instrument.mjs app.mjs`.
- `getting-started-verify/javascript.fastify.mdx:13-15`: a route that throws creates an issue.
- `getting-started-verify/javascript.fastify.mdx:30,36-47`: "update the previous code snippet by starting a trace" with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` inside an `async (request, reply)` handler that throws.
- `install/esm.mdx:44-48`: `NODE_OPTIONS="--import ./instrument.mjs" npm run start` as an alternative.
- `install/esm-without-import.mdx:26-34`: a first-line import means "only native Node.js APIs can be instrumented ... will not capture data from ... framework-specific data".
- `install/late-initialization.mdx:37,68`: `node --require @sentry/node/preload app.js` / `node --import @sentry/node/preload app.js`, then `Sentry.init()` later; `:103-124` `SENTRY_PRELOAD_INTEGRATIONS` with `Fastify` in the list.
- `integrations/fastify.mdx:17-21`: `Sentry.fastifyIntegration`, enabled by default, "adds instrumentation for the Fastify framework to capture spans using `@opentelemetry/instrumentation-fastify`"; `:29-31` supported versions `^3.0.0 || ^4.0.0`.
- `features/error-handler.mdx:6`: the error handler captures "all errors with status codes 5xx and above, as well as errors with status codes 2xx and below"; `:12-25` `import { setupFastifyErrorHandler } from "@sentry/fastify"`, `const app = fastify()`, `Sentry.init` after, then `setupFastifyErrorHandler(app)`; `:29-48` `setupFastifyErrorHandler(app, { shouldHandleError(error, request, reply) })`.
- `migration/v10-to-v11/index.mdx:715-718`: Fastify errors are captured by the integration, `setupFastifyErrorHandler(app)` is deprecated; `:722` `shouldHandleError` moved to `fastifyIntegration()`; `:112` Fastify 3.0 through 3.20 no longer supported; `:436-438` `handler` and `middleware` ops; `:1377` `instrumentFastify`, `handleFastifyError`, `setShouldHandleError` removed.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `fastify@5` succeeded (`added 108 packages in 10s`), `fastify4/`
(`added 49 packages`). `node_modules/@sentry` holds `bundler-plugins conventions core node opentelemetry
server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*`
entry except `@sentry/conventions@0.20.0` (a normal published dependency). **Holds.**

Exports the snippets use, checked in `node_modules/@sentry/node/build/types/index.d.ts:6` and
`node_modules/@sentry/server-utils/build/types/integrations/fastify/`:

| Export | Status on develop |
| --- | --- |
| `setupFastifyErrorHandler(app)` | exists, `@deprecated` ("No-op kept so existing `setupFastifyErrorHandler(app)` calls keep working ... Remove this call. To filter errors, set `shouldHandleError` on `fastifyIntegration` instead"), declared with one parameter `_fastify: unknown`, body is empty (`build/esm/integrations/fastify/index.js`) |
| `setupFastifyErrorHandler(app, { shouldHandleError })` (`features/error-handler.mdx:44`) | no such signature; the second argument is ignored |
| `fastifyIntegration(options?)` | exists; options `shouldHandleError(error, request, reply)`; d.ts says "supports Fastify v3.21.0-v5.0.0", instrumentation.d.ts says `>= 3.21.0 < 6` |
| `@sentry/fastify` package (`features/error-handler.mdx:14`) | **does not exist**: not in the toolbox tarballs, not in the monorepo `packages/`, `npm` resolution fails |
| `@opentelemetry/instrumentation-fastify` (`integrations/fastify.mdx:21`) | **not a dependency** of `@sentry/node` or `@sentry/server-utils`; the build subscribes to Fastify's `fastify.initialization` and `tracing:fastify.request.handler:error` diagnostics channels itself |
| `@sentry/node/preload` | **does not exist**: the package `exports` are `. ./import ./vite ./rollup ./webpack ./esbuild` (see `../express/README.md`) |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger.info` | exist |

### Step 2, Configure

`instrument.mjs` / `instrument.js` are the config snippets verbatim plus `tunnel` and `debug: true`.
`debug: true` prints no SDK name or version; identity was read off the envelopes: `sentry.javascript.node`
`10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** (identical to the Express run):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `SDK initialized from ESM` (or `CommonJS`), `[Sentry] Runtime hook
registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per run `Sentry Logger [warn]:
Discarded session because of missing or non-string release`; the guide's config sets no `release`.

### Step 3, Apply instrumentation (variant `import`, `results-import.json`)

Error event for `/debug-sentry` (HTTP 500 from Fastify's default error handler):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.function.fastify","handled":false,
 "level":"error","sdk":"sentry.javascript.node","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4719/debug-sentry","method":"GET","hasData":false},"user":{"ip_address":"127.0.0.1"}}
```

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle:
stream` on every span); **no `transaction` envelope was sent for any route in any variant**. Segment names come
from the route (`sentry.segment.name.source=route`, `http.route` set, op `http.server`, origin
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

Child spans per request, all `origin: auto.http.fastify`: `middleware fastify - onRequest` (the named
`auditHook`; the span name is `<pluginName> - <hook>`, the function name lands in `hook.callback.name`) and
**two** `handler` spans named by the bare route (`handler /users/:id` twice: one is the request span the
integration opens in its own `onRequest` hook with `http.request.method`, `url.path`, `http.route`,
`http.response.status_code`, the other is the route-handler span nested inside it with `hook.name: fastify -
route-handler`, `fastify.type: request-handler`, `hook.callback.name: anonymous`). The `/nope` probe gets
`handler Request handler` (the fallback name). Under v11 the ops are the bare `middleware` and `handler`
(`v10-to-v11/index.mdx:436-438`), not `hook.fastify` / `request_handler.fastify`.

`/error-404` was **not** captured on Fastify 5, `/error-503` was (`auto.function.fastify`); the default filter is
`reply.statusCode >= 500 || reply.statusCode <= 299` (`build/esm/integrations/fastify/utils.js`). No error was
captured twice on Fastify 5 (`duplicate_error_events: []`), so the channel-plus-`onError` dedupe described in
`errors.d.ts` holds.

Log item: `{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage`
event with `mechanism: generic`, `handled: true`, `transaction: GET /sentinel`.

### Step 4, Verify tracing snippet: works on both majors

`/debug-sentry-tracing` (the `async (request, reply)` handler from `getting-started-verify/javascript.fastify.mdx:36-47`):

| | fastify 5.12.3 (`results-import.json`) | fastify 4.29.1 (`results-fastify4.json`) |
| --- | --- | --- |
| HTTP response | 500 after ~104 ms | 500 |
| error event | `mechanism: auto.function.fastify`, `handled: false`, `transaction: GET /debug-sentry-tracing` | same |
| `test` span | `My First Test Transaction`, `status: error`, `origin: manual`, child of the `GET /debug-sentry-tracing` segment, in a `span` envelope | same |
| segment | `status: error`, `http.response.status_code: 500` | same |

Fastify forwards a rejected handler promise to its error handling on both majors, so unlike Express 4
(`../express/README.md`, Step 4) nothing hangs. The span is named "My First Test Transaction" but arrives as a
`test` child span inside a `span` envelope; there is no transaction anywhere in the sink.

### Step 5, Manual setup variants

`import`, `cjs`, `self-import`, `node-options`, `require-flag`, `no-handler`, `handler-options` all produced
**the same item shapes** on Fastify 5: 4 events, 8 `span` envelopes, 1 `log`, 46 integrations, route-named
segments, `middleware` and `handler` child spans, `/debug-sentry` captured with `auto.function.fastify`.

- **`esm-tab`** (`getting-started-use/javascript.fastify.mdx:20`, `import "./instrument";` verbatim): the app
  does not start, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/fastify/instrument'
  imported from $REPRO/quickstarts/fastify/app-esm-tab.mjs ... Did you mean to import "./instrument.js"?`. Same
  extensionless import as the Express tab (`../express/README.md`) and `install/esm-without-import.mdx:55`.
  `results-esm-tab.json`.
- **`cjs`** (`require("./instrument");` verbatim, `app.js`): works; `SDK initialized from CommonJS`.
- **`self-import`** (`import "./instrument.mjs";` first line, no flag): identical to `--import`, including every
  `middleware` and `handler` span and the `auto.function.fastify` error capture. `install/esm-without-import.mdx:28-30`
  says this method cannot capture "framework-specific data"; on develop it does for Fastify (the diagnostics-channel
  instrumentation needs no module hook). `results-self-import.json`.
- **`node-options`**: identical to the flag.
- **`require-flag`** (`node --require ./instrument.js app.mjs`): works fully but prints `[Sentry] Initializing
  the SDK via the Node \`--require\` flag is no longer supported ...` first (`app-require-flag.log:1`), already
  reported in `../node/README.md`.
- **`no-handler`** (no `setupFastifyErrorHandler(app)` at all): `/debug-sentry`, `/error-503` and the tracing
  route captured exactly as with the handler (`auto.function.fastify`, `handled: false`), 404 skipped. The
  deprecated call is an empty function and prints no deprecation notice at runtime (`deprecation_output: []`).
- **`handler-options`** (`setupFastifyErrorHandler(app, { shouldHandleError })` from `features/error-handler.mdx:44-48`,
  with a callback that logs every call and returns `true`): the callback was **never called**
  (`should_handle_error_calls: []`), `/error-404` stayed uncaptured, the output is byte-for-byte the default
  behaviour. The options object is silently dropped. `results-handler-options.json`.
- **`integration-options`** (`fastifyIntegration({ shouldHandleError(error, request, reply) { return reply.statusCode >= 400 } })`,
  the place `v10-to-v11/index.mdx:722` names): 5 events, `/error-404` now captured too; the callback ran four
  times with the final status (`GET /error-404 -> 404`, `GET /debug-sentry -> 500`, ...). `results-integration-options.json`.
- **`error-handler-page`** (`features/error-handler.mdx:13-24` verbatim): the app does not start,
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@sentry/fastify' imported from
  $REPRO/quickstarts/fastify/app-error-handler-page.mjs`. The snippet also calls `fastify()` without importing it,
  which would fail next. `results-error-handler-page.json`.
- **`late-init`** (`node --import @sentry/node/preload app-late.mjs`, `install/late-initialization.mdx:68`):
  the app does not start, `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './preload' is not defined by
  "exports" in $REPRO/quickstarts/fastify/node_modules/@sentry/node/package.json`, as in `../express/README.md`;
  `v10-to-v11/index.mdx:1359` says the entry point was removed. `results-late-init.json`.
- **`fastify4`**, **`fastify4-no-handler`** (Fastify `4.29.1`, `integrations/fastify.mdx:31` names this major):
  same span shapes as Fastify 5, but **5 events: `/error-404` is captured by default**. Fastify 4 runs `onError`
  hooks before `lib/error-handler.js:84-86` copies `error.statusCode` onto the reply, so the SDK's default filter
  sees `reply.statusCode === 200` and takes the `<= 299` branch; Fastify 5 reports the final `404` (the
  `integration-options` log above). Both Fastify 4 runs also print once
  `(node:<pid>) [FSTDEP017] DeprecationWarning: You are accessing the deprecated "request.routerPath" property`
  when the unmatched `/nope` probe is hit: the integration falls back from `request.routeOptions.url` to
  `request.routerPath` for unrouted requests (`build/esm/integrations/fastify/instrumentation.js`,
  `getRequestRouteUrl`). `results-fastify4.json`, `results-fastify4-no-handler.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/node` is all you need (`getting-started-install/javascript.node.mdx:3-5`) | **yes** |
| `instrument.mjs` snippet initializes the SDK (`getting-started-config/javascript.node.mdx:37-70`) | **yes** |
| CommonJS tab, `require("./instrument")` then `setupFastifyErrorHandler(app)` (`getting-started-use/javascript.fastify.mdx:1-16`) | **yes**, but the handler call is a deprecated no-op |
| ESM tab, `import "./instrument";` (`getting-started-use/javascript.fastify.mdx:18-33`) | **no**, `ERR_MODULE_NOT_FOUND`; works with `./instrument.mjs` |
| `node --import ./instrument.mjs app.mjs` instruments the app (`getting-started-node/javascript.mdx:93-96`) | **yes** |
| Init before any other module or "auto-instrumentation ... may not work" (`getting-started-node/javascript.mdx:55`) | **partial**, a first-line import is equivalent for Fastify on develop |
| `/debug-sentry` throw creates an issue (`getting-started-verify/javascript.fastify.mdx:13-15`) | **yes**, `auto.function.fastify`, `handled: false`, `transaction: GET /debug-sentry`, request data present |
| Tracing verify snippet (`getting-started-verify/javascript.fastify.mdx:36-47`) | **yes** on Fastify 4 and 5; the span is a `test` child in a `span` envelope, there is no transaction |
| `NODE_OPTIONS="--import ./instrument.mjs"` alternative (`install/esm.mdx:44-48`) | **yes** |
| Direct import loses framework data (`install/esm-without-import.mdx:28-30`) | **no** for Fastify on develop |
| `@sentry/node/preload` late initialization (`install/late-initialization.mdx:37,68`, `Fastify` at `:114`) | **no**, subpath not exported |
| `setupFastifyErrorHandler` lives in `@sentry/fastify` (`features/error-handler.mdx:14`) | **no**, the package does not exist; it is exported from `@sentry/node` |
| `setupFastifyErrorHandler(app, { shouldHandleError })` filters errors (`features/error-handler.mdx:29-48`) | **no**, the function takes one argument and does nothing; the callback never runs |
| Default capture is "5xx and above, as well as 2xx and below" (`features/error-handler.mdx:6`) | **partial**: that is the code, but the user-visible result differs by major: a thrown `{ statusCode: 404 }` is dropped on Fastify 5 and captured on Fastify 4 |
| Errors captured without the handler (`v10-to-v11/index.mdx:715-718`) | **yes** |
| `fastifyIntegration({ shouldHandleError })` (`v10-to-v11/index.mdx:722`) | **yes** (the page shows only the Express example) |
| Spans come from `@opentelemetry/instrumentation-fastify` (`integrations/fastify.mdx:21`) | **no**, the package is not installed; the SDK's own diagnostics-channel instrumentation produced every span |
| Supported versions `^3.0.0 || ^4.0.0` (`integrations/fastify.mdx:31`) | **stale**, Fastify 5.12.3 is fully instrumented and the d.ts says `>= 3.21.0 < 6`; `v10-to-v11/index.mdx:112` drops 3.0-3.20 |
| `handler` / `middleware` ops (`v10-to-v11/index.mdx:436-438`) | **yes** |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **not tested**, only Node v26.5.0 was available |

## Files

`package.json`, `fastify4/package.json`, `instrument.mjs`, `instrument.js`, `instrument-options.mjs`, `routes.mjs`,
`routes.js`, `app.mjs`, `app.js`, `app-esm-tab.mjs`, `app-first-line.mjs`, `app-no-handler.mjs`,
`app-handler-options.mjs`, `app-error-handler-page.mjs`, `app-late.mjs`, `fastify4/app.mjs`,
`fastify4/app-no-handler.mjs`, `run.sh`, `summarize.mjs`, `sink.mjs` (a copy of `../express/sink.mjs`),
`results-<variant>.json`, `app-<variant>.log`, `sink-<variant>.log`.
