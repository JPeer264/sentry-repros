# QS-hono, Hono getting-started path (Node.js tab), against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
`hono` `4.13.7` and `@hono/node-server` `2.1.1` from the registry (the guide requires Hono `4.0.0` or above and
names no major for `@hono/node-server`). All envelopes go to a local sink via the `tunnel` option; nothing leaves
the machine.

Only the Node.js tab of the guide was run here; the Cloudflare, Bun and Deno tabs are covered by the runtime
cells. The Express, Fastify and Koa runs (`../express/README.md`, `../fastify/README.md`, `../koa/README.md`)
already report the Node-only install-page findings (the extensionless `import "./instrument"`, the removed
`@sentry/node/preload` entry, the `--require` banner, the missing-release session warning); only their Hono
status is recorded here.

## What it reproduces

A new user following the Hono guide on Node end to end: install `@sentry/hono` and `@sentry/node`, write
`instrument.mjs` importing from `@sentry/hono/node`, start with `node --import ./instrument.mjs`, add
`app.use(sentry(app))`, and run the verify step. One Hono app served by `@hono/node-server` with these routes:

| Route | What it does | Snippet |
| --- | --- | --- |
| `/debug-sentry` | `app.get("/debug-sentry", () => { throw new Error("My first Sentry error!"); });` | `getting-started-verify/javascript.hono.mdx:13-15`, verbatim |
| `/debug-sentry-tracing` | the `async ()` handler with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` that throws | `getting-started-verify/javascript.hono.mdx:36-47`, verbatim except the path so both verify snippets share one server |
| `/users/:id` | `c.json({ id: c.req.param("id") })`, a parameterized route for span naming | repro-only |
| `/error-401`, `/error-404`, `/error-503` | `throw new HTTPException(status, { message })`, to see which HTTP errors the default `shouldHandleError` keeps | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named middleware (`auditMiddleware`) is registered after `sentry()` so middleware spans are visible. The
readiness probe hits `/nope` (unmatched route), which shows how an unrouted request is named. `serve(app)` from
the guide would listen on port 3000; the repro passes `{ fetch: app.fetch, port, hostname }` instead.

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.hono`), then
`fallbackGuide` (`javascript.node`, from `guides/hono/index.mdx:5`), then platform (`javascript`), then `_default`.
The guide page itself renders only four includes; the Node install pages render two more Hono-specific ones.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/hono/index.mdx:24` prerequisites | `platform-includes/getting-started-prerequisites/javascript.hono.mdx:1-7` (Hono `4.0.0` or above) |
| `index.mdx:36` features expandable | `includes/quick-start-features-expandable.mdx:29` (Hono listed in the server row) |
| `index.mdx:44-59` install | inline: `npm install @sentry/hono` |
| `index.mdx:65-94` peer dependency | inline: `npm install @sentry/node` (Node.js tab, `:80-82`) |
| `index.mdx:156-225` Node.js configure | inline: `instrument.mjs` importing `@sentry/hono/node` (`:167-198`), `node --import ./instrument.mjs app.js` (`:214`), `NODE_OPTIONS="--import ./instrument.mjs"` (`:218`) |
| `index.mdx:227-328` add the middleware | inline: Node.js tab `app.ts` (`:264-276`), `app.use(sentry(app))`, `serve(app)` |
| `index.mdx:360-364` report unhandled exceptions | inline text, links to `guides/hono/features/error-handler.mdx` |
| `index.mdx:368`, `:372` | `getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (not run) |
| `index.mdx:376` verify | `platform-includes/getting-started-verify/javascript.hono.mdx:12-16` (issues), `:35-48` (tracing), `:56-60` (logs, only under a `logs` onboarding option that `index.mdx:32-34` does not offer) |
| `index.mdx:382` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| `guides/hono/features/index.mdx` | `<PageGrid />` over `features/error-handler.mdx` (the only feature page) |
| `guides/hono/features/error-handler.mdx:52-77` | inline: Node.js tab with `sentry(app, { shouldHandleError })` |
| `docs/platforms/javascript/common/install/commonjs.mdx:25` (lists `javascript.hono` at `:11`) | `platform-includes/getting-started-config/javascript.hono.mdx:1-35` (CommonJS) and `:37-71` (ESM), both from `@sentry/node` |
| `install/commonjs.mdx:29` | `platform-includes/getting-started-use/javascript.hono.mdx:1-10` (`require("./instrument")` then `@hono/node-server` and `hono`) |
| `install/esm.mdx:24-35`, `install/esm-without-import.mdx:38-58`, `install/late-initialization.mdx:37,68` | inline, all `@sentry/node`, all list `javascript.hono` at `:11` |
| `platform-includes/getting-started-capture-errors/javascript.hono.mdx` | rendered by no page for Hono (the guide has its own inline section at `index.mdx:360-364`); it names `honoIntegration`'s `shouldHandleError` |
| `docs/platforms/javascript/common/configuration/integrations/` | no `hono.mdx`; the migration page says `honoIntegration` was removed (`migration/v10-to-v11/index.mdx:993,1369`) |
| `migration/v10-to-v11/index.mdx:437-438` | span ops `hono.request` -> `http.server`, `middleware.hono` -> `middleware` |

## Install

```bash
cd $REPRO/quickstarts/hono
npm install            # package.json pins the seven develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus hono@4 and @hono/node-server@2
```

## Run

```bash
cd $REPRO/quickstarts/hono
./run.sh import               # node --import ./instrument.mjs app.mjs                    -> results-import.json
./run.sh node-options         # NODE_OPTIONS="--import ./instrument.mjs" node app.mjs     -> results-node-options.json
./run.sh cjs                  # node app.js  (install/commonjs.mdx, instrument.js requires @sentry/node) -> results-cjs.json
./run.sh cjs-hono-node        # node app-cjs-hono-node.js (same, requires @sentry/hono/node)  -> results-cjs-hono-node.json
./run.sh esm-sentry-node      # node --import ./instrument-sentry-node.mjs app.mjs (install/esm.mdx, init from @sentry/node) -> results-esm-sentry-node.json
./run.sh self-import          # node app-first-line.mjs (import "./instrument.mjs" first line, no flag) -> results-self-import.json
./run.sh esm-tab              # node app-esm-tab.mjs (import "./instrument" as install/esm-without-import.mdx:55 prints it) -> results-esm-tab.json
./run.sh should-handle-error  # --import, app from features/error-handler.mdx:52-77          -> results-should-handle-error.json
./run.sh verify-verbatim      # --import, verify snippets pasted into the guide app, no Sentry import -> results-verify-verbatim.json
./run.sh root-import          # --import, app with import * as Sentry from "@sentry/hono"    -> results-root-import.json
./run.sh onerror              # --import, app with a user-defined app.onError                -> results-onerror.json
./run.sh errors-only          # --import instrument-errors-only.mjs (no tracesSampleRate)   -> results-errors-only.json
./run.sh late-init            # node --import @sentry/node/preload app.mjs                   -> results-late-init.json
```

Each run starts the sink on `127.0.0.1:4728` and one app on `127.0.0.1:4729` (both checked free first), curls
the routes in order (`/users/42`, `/debug-sentry`, `/error-401`, `/error-404`, `/error-503`, `/debug-log`,
`/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), polls `/__items` until the sentinel event, the
sentinel's server span (skipped for `errors-only`, which sends no spans) and the log batch have all arrived (hard
deadline 60 s, no fixed sleeps), writes `results-<variant>.json` (steps with HTTP codes, console output with the
installed integrations, the compact sink items, the raw span payloads and a computed verdict) via
`summarize.mjs`, and kills both processes. Machine paths are replaced by `$REPRO`.
`results-verify-verbatim-both.json` is an extra run of the verify app with both verify snippets kept.

## Expected (what the guide claims)

- `index.mdx:44-50`: `npm install @sentry/hono`; `:71,80-82`: install the peer `@sentry/node` and keep it in sync, "You won't import it directly".
- `index.mdx:162-198`: create `instrument.mjs`; "IMPORTANT: import from `@sentry/hono/node`, not `@sentry/node`".
- `index.mdx:208-219`: load it with `node --import ./instrument.mjs app.js` or `NODE_OPTIONS="--import ./instrument.mjs"`.
- `index.mdx:233-235,264-276`: `app.use(sentry(app))` "as early as possible"; on Node "the middleware doesn't take any options".
- `index.mdx:362`: "Sentry captures exceptions from Hono's `onError` handler, excluding errors with 3xx or 4xx status codes".
- `features/error-handler.mdx:12-19`: 5xx and non-HTTP errors are captured, 3xx-4xx ignored; `:25,52-77`: `sentry(app, { shouldHandleError })` capturing 401 and 403 in addition.
- `getting-started-verify/javascript.hono.mdx:7,13-15`: "Add the following code snippet to your main application file", `app.get("/debug-sentry", ...)` throws and creates an issue.
- `getting-started-verify/javascript.hono.mdx:30,36-47`: "update the previous code snippet by starting a trace" with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })`.
- `install/commonjs.mdx:21-29` -> `getting-started-config/javascript.hono.mdx:2,38` and `getting-started-use/javascript.hono.mdx:3`: `instrument.js` from `@sentry/node`, `require("./instrument")` first.
- `install/esm.mdx:24-35,41,47`: `instrument.mjs` from `@sentry/node`, `--import` or `NODE_OPTIONS`.
- `install/esm-without-import.mdx:28-30,55`: a first-line `import "./instrument";` means "only native Node.js APIs can be instrumented".
- `install/late-initialization.mdx:37,68`: `node --require @sentry/node/preload app.js` / `node --import @sentry/node/preload app.js`.
- `migration/v10-to-v11/index.mdx:437-438`: Hono middleware spans use op `middleware`; `:993,1369`: `honoIntegration` was removed in favour of `@sentry/hono`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the seven develop tarballs plus `hono@4` and `@hono/node-server@2` succeeded (`added 62
packages in 4s`). `node_modules/@sentry` holds `bundler-plugins conventions core hono node opentelemetry
server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*`
entry except `@sentry/conventions@0.20.0` (a normal published dependency). **Holds.** `@sentry/hono` lists
`hono ^4.x` and `@hono/node-server ^1.x || ^2.x` as peers; the guide never installs either, but its
prerequisites assume a running Hono app, and `@sentry/hono/node` imports `@hono/node-server/conninfo`
(`build/esm/node/middleware.js`), so `@hono/node-server` is required on Node, not optional.

Exports the snippets use, checked in `node_modules/@sentry/hono/build/types/index.node.d.ts`,
`node/middleware.d.ts`, `node/sdk.d.ts`, `index.d.ts` and `node_modules/@sentry/node/build/types/index.d.ts`:

| Export | Status on develop |
| --- | --- |
| `sentry(app, options?)` from `@sentry/hono/node` | exists; `options` is `SentryHonoMiddlewareOptions` with the single field `shouldHandleError?: (error: unknown) => boolean`; the JSDoc says init must happen separately via `--import` |
| `init(options)` from `@sentry/hono/node` | exists; tags the client `sentry.javascript.hono`, removes any integration named `Hono`, appends `ignoreSpans` patterns for `/node_modules/`, `/favicon.ico`, `/@id/`, `/@fs/`, `/@vite/`, then calls `@sentry/node`'s `init` |
| everything else on `@sentry/hono/node` (`startSpan`, `captureMessage`, `logger`) | `export * from '@sentry/node'` |
| `@sentry/hono` root (`.`) | **exports nothing**: `index.d.ts` is `export {};` and the runtime namespace is `[]` (`results-root-import.json`) |
| `honoIntegration` (`getting-started-capture-errors/javascript.hono.mdx:3`) | **does not exist** in `@sentry/node` or `@sentry/server-utils` types |
| `@sentry/node/preload` | **does not exist**: the package `exports` are `. ./import ./vite ./rollup ./webpack ./esbuild` (see `../express/README.md`) |
| `@deprecated` markers in `@sentry/hono/build/types` | none |

### Step 2, Configure

`instrument.mjs` is `index.mdx:167-198` verbatim (error-monitoring + performance options) plus `tunnel` and
`debug: true`. `debug: true` prints no SDK name or version; identity was read off the envelopes:
`sentry.javascript.hono` `10.67.0` (event `sdk`, span envelope header and `sentry.sdk.name` on every span),
runtime `node` `v26.5.0`. **46 integrations installed** with `tracesSampleRate: 1.0`, the same list as the
Express, Fastify and Koa runs (no `Hono` integration exists to be filtered):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

With the error-monitoring option only (`errors-only`, no `tracesSampleRate`), **23 integrations**:

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `SDK initialized from ESM` (or `CommonJS`), `[Sentry] Runtime hook
registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per run `Sentry Logger [warn]:
Discarded session because of missing or non-string release` (the guide sets no `release`, see
`../node/README.md`). No deprecation output in any variant.

### Step 3, Add the middleware (variant `import`, `results-import.json`)

Error event for `/debug-sentry` (HTTP 500 from Hono's default `onError`):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.hono.context_error","handled":false,
 "level":"error","sdk":"sentry.javascript.hono","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4729/debug-sentry","method":"GET","hasData":false,"headers":{"accept":"*/*","host":"127.0.0.1:4729","user-agent":"curl/8.7.1"}},
 "user":{"ip_address":"127.0.0.1"},"environment":"production"}
```

**Four** events per run: `/debug-sentry`, `/debug-sentry-tracing`, `/error-503` (`Error: custom 503`,
`auto.http.hono.context_error`, `handled: false`) and the sentinel. `/error-401` and `/error-404` (Hono
`HTTPException`) were answered with 401/404 and **not captured**, matching `index.mdx:362` and
`features/error-handler.mdx:12-19`. No error was captured twice (`duplicate_error_events: []`). The event
`transaction` and the request data (`url`, `method`, headers, `user.ip_address` from `@hono/node-server`'s
`getConnInfo`) are present on every event, and the mechanism type `auto.http.hono.context_error` says the error was read
from `context.error`, not from `onError` itself.

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle:
stream` on every span); **no `transaction` envelope was sent for any route in any variant**. Segment names come
from the matched route (`sentry.segment.name.source: route`, `http.route` set, op `http.server`, origin
`auto.http.http_server`, plus `client.address`, `client.port`, `network.transport`, `network.type` from
`getConnInfo`):

```
GET /*                      [source=route status=error 404]   (readiness probe /nope, unmatched)
GET /users/:id              [source=route status=ok    200]
GET /debug-sentry           [source=route status=error 500]
GET /error-401              [source=route status=error 401]
GET /error-404              [source=route status=error 404]
GET /error-503              [source=route status=error 503]
GET /debug-log              [source=route status=ok    200]
GET /debug-sentry-tracing   [source=route status=error 500]
GET /sentinel               [source=route status=ok    200]
```

The unmatched `/nope` probe is named `GET /*` with `http.route: /*` and `source: route`: `resolveRouteName`
falls back to `routePath(context, -1)`, and `app.use(sentry(app))` itself matches `/*`, so every 404 for an
unknown path lands in one `GET /*` segment that is labelled as a route. Child spans per request: one
`middleware auditMiddleware` (op `middleware`, origin `auto.middleware.hono`, no `code.function.name` or
`hono.*` attributes, only the shared span attributes) per request, matching `v10-to-v11/index.mdx:438`. There is
no `handler` or `router` span for Hono, and no span for the `sentry()` middleware itself.

Log item: `{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage` event
with `mechanism: generic`, `handled: true`, `transaction: GET /sentinel`.

Hono's default `onError` stays in place and prints every captured error to stderr (`hono_default_error_log: 2`
in `import`: the `Error: My first Sentry error!` stack, top frame `routes.mjs:12:11`, twice), the same errors the
SDK captured; the SDK adds nothing to that output.

### Step 4, Verify

**Issues** (`getting-started-verify/javascript.hono.mdx:13-15`): with a `Sentry`-free app the snippet runs as
pasted and gives the event above. **Holds.**

**Tracing** (`getting-started-verify/javascript.hono.mdx:36-47`): the snippet calls `Sentry.startSpan`, but no
Hono snippet imports `Sentry` into the application file: the Node tab (`index.mdx:264-267`) imports only
`{ sentry }` from `@sentry/hono/node`, and `index.mdx:71` says of `@sentry/node` "You won't import it directly".
Pasted verbatim (`app-verify-verbatim.mjs`, `results-verify-verbatim.json`): `/debug-sentry` answers 500,
the SDK captures `ReferenceError: Sentry is not defined` (`auto.http.hono.context_error`, `handled: false`,
`transaction: GET /debug-sentry`), and no `test` span exists. The nearest guess, `import * as Sentry from
"@sentry/hono"` (`app-root-import.mjs`, `results-root-import.json`), is no better: the root entry exports
nothing (`root export keys: []`), so the route throws `TypeError: Sentry.startSpan is not a function`, again
captured as an error. With `import * as Sentry from "@sentry/hono/node"` (`routes.mjs`) the route gives HTTP 500
after ~104 ms, the error event above for `GET /debug-sentry-tracing`, and a `test` span `My First Test
Transaction` (`status: error`, `origin: manual`) as a child of the `GET /debug-sentry-tracing` segment inside a
`span` envelope. The span is named "My First Test Transaction", the page text says "starting a trace", and the
config snippet on the CommonJS page says "100% of transactions" (`getting-started-config/javascript.hono.mdx:21,57`),
but there is no transaction anywhere in the sink.

If the user *adds* the tracing snippet instead of replacing the first one (`:30` says "update the previous code
snippet"), Hono dispatches the first `app.get("/debug-sentry")` and its synchronous throw ends the request: the
tracing handler never runs and no `test` span appears (`results-verify-verbatim-both.json`: 2 events, no
children, the plain error captured from the first handler).

### Step 5, Install and setup variants

`import`, `node-options`, `cjs-hono-node`, `self-import`, `should-handle-error`, `onerror` all produced **the same
item shapes**: 4 events (5 with `shouldHandleError`), 9 `span` envelopes, 1 `log`, 46 integrations, route-named
segments, `middleware auditMiddleware` child spans, `/debug-sentry` captured with `auto.http.hono.context_error`.

- **`cjs`** (`install/commonjs.mdx:25,29` for `javascript.hono`: `instrument.js` from
  `getting-started-config/javascript.hono.mdx:1-35` with `require("@sentry/node")`, app from
  `getting-started-use/javascript.hono.mdx:1-10`): everything arrives, but the SDK name is
  **`sentry.javascript.node`** and the console prints `[Sentry] Sentry was not initialized with
  \`@sentry/hono/node\`. Please import from \`@sentry/hono/node\` to ensure Hono-specific instrumentation is
  applied correctly.` The install page contradicts the guide's "IMPORTANT" comment (`index.mdx:168`) and the
  build's warning. What is lost: the Hono SDK tag and the `ignoreSpans` patterns from `init` (not visible in
  this repro's routes). `results-cjs.json`.
- **`cjs-hono-node`** (`require("@sentry/hono/node")` in `instrument.js`): `sentry.javascript.hono`, no
  warning, `SDK initialized from CommonJS`. `results-cjs-hono-node.json`.
- **`esm-sentry-node`** (`install/esm.mdx:24-35` verbatim, `import * as Sentry from "@sentry/node"`, started with
  `--import`): same as `cjs`, `sentry.javascript.node` plus the warning. `results-esm-sentry-node.json`.
- **`self-import`** (`import "./instrument.mjs";` first line, no flag, the direct-import page with its
  extension fixed): **identical to `import`**, `sentry.javascript.hono`, route-named segments, `middleware`
  spans, all errors. The Hono middleware patches the app instance when `sentry(app)` runs and the server span
  comes from the `Http` integration's `node:http` hook, so nothing depends on being loaded before `hono`.
  `install/esm-without-import.mdx:28-30` ("only native Node.js APIs can be instrumented") is wrong for Hono, as
  it is for Fastify (`../fastify/README.md`) and unlike Koa (`../koa/README.md`). `results-self-import.json`.
- **`esm-tab`** (`install/esm-without-import.mdx:55`, `import "./instrument";` verbatim): the app does not start,
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$REPRO/quickstarts/hono/instrument' imported from
  $REPRO/quickstarts/hono/app-esm-tab.mjs`. Same as the Express, Fastify and Koa runs. `results-esm-tab.json`.
- **`node-options`**: identical to the flag. `results-node-options.json`.
- **`should-handle-error`** (`features/error-handler.mdx:52-77` Node tab): `/error-401` is now captured
  (`Error: custom 401`, `auto.http.hono.context_error`, `handled: false`, `transaction: GET /error-401`),
  `/error-404` still is not, 5 events. **Holds.** `results-should-handle-error.json`.
- **`onerror`** (guide app plus `app.onError((err, c) => c.json({ error: err.message }, 500))`): the user's
  handler ran for all five errors (`app.onError:` lines) and every response became a 500, yet the SDK captured
  exactly the same set as before (`/debug-sentry`, `/debug-sentry-tracing`, `/error-503`; the 401 and 404
  `HTTPException`s stayed ignored). The filter reads the thrown error's `status`, not the response status, and
  capture does not depend on Hono's `onError` at all: the middleware reads `context.error` after `next()`. Hono's
  default stderr logging is gone in this variant (`hono_default_error_log: 0`). `results-onerror.json`.
- **`errors-only`** (config without `tracesSampleRate`): 23 integrations, 0 `span` envelopes, the same 4 events
  with `auto.http.hono.context_error`, `transaction: GET /debug-sentry` and full request data.
  `results-errors-only.json`.
- **`verify-verbatim`**, **`root-import`**: see Step 4.
- **`late-init`** (`node --import @sentry/node/preload app.mjs`, `install/late-initialization.mdx:68`, page
  lists `javascript.hono` at `:11`): the app does not start, `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package
  subpath './preload' is not defined by "exports" in $REPRO/quickstarts/hono/node_modules/@sentry/node/package.json`,
  as in `../express/README.md`. `results-late-init.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/hono` plus `@sentry/node` (`index.mdx:50,81`) | **yes** (with `hono` and `@hono/node-server` already present, as the prerequisites assume) |
| `instrument.mjs` from `@sentry/hono/node` initializes the SDK (`index.mdx:167-198`) | **yes**, `sentry.javascript.hono` `10.67.0`, 46 integrations |
| `node --import ./instrument.mjs app.js` / `NODE_OPTIONS` (`index.mdx:214,218`) | **yes** (the tab names the app file `app.ts` at `:264`, the command runs `app.js`) |
| `app.use(sentry(app))` instruments requests, no options on Node (`index.mdx:235,271`) | **yes**; `sentry()` does accept `{ shouldHandleError }` on Node, so "doesn't take any options" is only true for init options |
| Errors from Hono's `onError` are captured, 3xx/4xx excluded (`index.mdx:362`, `features/error-handler.mdx:12-19`) | **yes**, including with a user-defined `onError`; the filter is on the thrown error's `status`, not the response |
| `shouldHandleError` captures 401/403 in addition (`features/error-handler.mdx:52-77`) | **yes** |
| Issues verify snippet in "your main application file" (`getting-started-verify/javascript.hono.mdx:7,13-15`) | **yes** |
| Tracing verify snippet (`getting-started-verify/javascript.hono.mdx:36-47`) | **no** as printed: `Sentry` is imported nowhere, `ReferenceError: Sentry is not defined`; the root `@sentry/hono` import gives `TypeError: Sentry.startSpan is not a function`; works with `import * as Sentry from "@sentry/hono/node"`, and then the `test` span is a child in a `span` envelope, there is no transaction |
| CommonJS install page, `instrument.js` from `@sentry/node` (`install/commonjs.mdx:25` -> `getting-started-config/javascript.hono.mdx:2,38`) | **contradicts the guide** (`index.mdx:168`): runs, but tags `sentry.javascript.node` and the build warns `Sentry was not initialized with @sentry/hono/node` |
| ESM install page, `instrument.mjs` from `@sentry/node` (`install/esm.mdx:25`) | same as above |
| Direct import loses framework data (`install/esm-without-import.mdx:28-30`) | **no** for Hono, `self-import` equals `import` |
| `import "./instrument";` (`install/esm-without-import.mdx:55`) | **no**, `ERR_MODULE_NOT_FOUND` (as Express, Fastify, Koa) |
| `@sentry/node/preload` late initialization (`install/late-initialization.mdx:37,68`) | **no**, subpath not exported (as Express, Koa) |
| `honoIntegration`'s `shouldHandleError` (`getting-started-capture-errors/javascript.hono.mdx:3`, unrendered) | **no such export**; the option lives on `sentry(app, { shouldHandleError })` |
| Hono middleware spans use op `middleware` (`v10-to-v11/index.mdx:438`) | **yes**, origin `auto.middleware.hono` |
| Hono `4.0.0` or above (`getting-started-prerequisites/javascript.hono.mdx:7`) | **not tested** beyond `4.13.7` |
| Node `>= 18` (`getting-started-prerequisites` has no Node line for Hono) | **not tested**, only Node v26.5.0 was available |

## Files

`package.json`, `instrument.mjs`, `instrument.js`, `instrument-hono-node.js`, `instrument-sentry-node.mjs`,
`instrument-errors-only.mjs`, `routes.mjs`, `routes.js`, `app.mjs`, `app.js`, `app-cjs-hono-node.js`,
`app-first-line.mjs`, `app-esm-tab.mjs`, `app-should-handle-error.mjs`, `app-verify-verbatim.mjs`,
`app-root-import.mjs`, `app-onerror.mjs`, `run.sh`, `summarize.mjs`, `sink.mjs` (a copy of `../koa/sink.mjs`
with four more span attributes in the compact view), `results-<variant>.json`, `app-<variant>.log`,
`sink-<variant>.log`.
