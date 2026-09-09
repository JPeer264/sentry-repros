# QS-elysia, Elysia getting-started path on Node, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
`elysia` `1.4.30` and `@elysiajs/node` `1.4.5` from the registry (the guide names no major for either; both are
on their `1.x` line). All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Bun and Deno sides of the same guide are covered by the runtime cells `../../cells/M-elysia-bun/README.md`
and `../../cells/M-elysia-deno/README.md`; this run is the Node.js tab only. The Node-only install findings
(the extensionless ESM import, the removed `@sentry/node/preload` entry, the `--require` banner, the
`@opentelemetry/instrumentation-*` mechanism claims) come from `../express/README.md`, `../fastify/README.md`,
`../koa/README.md` and `../hapi/README.md`; the Elysia guide renders none of the install-method pages
(`docs/platforms/javascript/common/install/{index,npm,loader}.mdx` list `javascript.elysia` under `notSupported`
at `:31`, `:30`, `:29`; `{esm,commonjs,esm-without-import,late-initialization}.mdx` have `supported` lists without
it), so those claims are not reachable from this guide and only their Elysia status is recorded here.

## What it reproduces

A new user following the Elysia guide's Node.js tab end to end: `npm install @sentry/elysia @elysiajs/node`,
write `index.ts` with `Sentry.init()` then `Sentry.withElysia(new Elysia({ adapter: node() }))`, run
`node index.ts`, add the verify route. One Elysia app with these routes (`routes.ts`, chained before `.listen()`):

| Route | What it does | Snippet |
| --- | --- | --- |
| `/` | `.get("/", () => "Hello World")` | `guides/elysia/index.mdx:125`, verbatim |
| `/debug-sentry` | `app.get("/debug-sentry", () => { throw new Error("My first Sentry error!"); });` | `guides/elysia/index.mdx:182-184`, verbatim |
| `/debug-sentry-tracing` | the `async ()` handler with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, ...)` that throws | `guides/elysia/index.mdx:205-216`, verbatim except the path so both verify snippets share one server |
| `/users/:id` | `function getUser({ params }) { return { id: params.id }; }`, a parameterized route with a named handler | repro-only |
| `/error-404`, `/error-503` | `set.status = 404` (503), then `throw new Error("custom 404")` (503) | repro-only |
| `/error-status-503` | `throw status(503, "custom status 503")`, Elysia's own status helper | repro-only |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |

A named `onBeforeHandle` hook (`auditHook`) is registered so a lifecycle phase other than Handle has a named
child. The readiness probe hits `/nope` (unmatched route), which shows how an unrouted request is named and
whether Elysia's `NotFoundError` is captured. `probe-status.ts` prints `context.set.status`, `context.code`
and the error class as the SDK's `onError` hook sees them for each error shape (`probe-status.out`).

## Which file each guide step renders from

The guide is almost entirely inline (`sdk: sentry.javascript.elysia`, `fallbackGuide: javascript.bun` at
`index.mdx:4-5`). Includes resolve as guide (`javascript.elysia`), then `javascript.bun`, then `javascript`,
then `_default`.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/elysia/index.mdx:14` alpha warning, `:24-25` prerequisites (Elysia `v1.4.0+`, "Bun or Node.js 18+ (with @elysiajs/node adapter)") | inline |
| `index.mdx:37` features expandable | `includes/quick-start-features-expandable.mdx:38-40` (issues, tracing, logs) |
| `index.mdx:46-48` alert "You do not need `@elysiajs/opentelemetry`", `:55-65` install (Bun tab `bun add @sentry/elysia`, Node.js tab `npm install @sentry/elysia @elysiajs/node`) | inline |
| `index.mdx:77` "Call `Sentry.init()` before creating your Elysia app, then wrap the app with `Sentry.withElysia()` before defining routes", `:82-103` Bun tab, `:105-127` Node.js tab (`filename: index.ts`) | inline |
| `index.mdx:139-152` "captures 5xx errors automatically via a global `onError` hook. Client errors (3xx/4xx) are not captured by default", `shouldHandleError` snippet | inline |
| `index.mdx:160`, `:164` | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx`, `getting-started-data-collection/javascript.mdx` (no elysia or bun file; not run) |
| `index.mdx:177-185` verify issues ("Add the following route to your app"), `:198-217` verify tracing ("update the previous code snippet by starting a trace") | inline |
| `index.mdx:227` logs verify (only under a `logs` onboarding option that `:32-34` does not offer) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24` |
| `index.mdx:235` locate data | `includes/quick-start-locate-data-expandable.mdx:38` |
| `guides/elysia/` | contains only `index.mdx`; no integration, configuration or tracing sub-page of its own |
| `common/tracing/instrumentation/automatic-instrumentation.mdx:35` | `platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:1-12` |
| `common/tracing/streamed-spans/index.mdx:74` | `platform-includes/performance/enable-stream-mode/javascript.elysia.mdx:1-25` |
| `common/tracing/instrumentation/index.mdx:93` | `platform-includes/performance/start-span/javascript.elysia.mdx:1-46` |
| `common/migration/v10-to-v11/index.mdx:392,436,438` | Elysia `handler` spans resolve a route, handler name in `code.function.name`; ops `handler` and `middleware` |

## Install

```bash
cd $REPRO/quickstarts/elysia
npm install            # package.json pins the eight develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus elysia@1 and @elysiajs/node@1
```

## Run

```bash
cd $REPRO/quickstarts/elysia
./run.sh guide                # node index.ts  (Node.js tab, routes chained before .listen())         -> results-guide.json
./run.sh verify-verbatim      # node index-verify-verbatim.ts  (verify route pasted after .listen())   -> results-verify-verbatim.json
./run.sh should-handle-error  # node index-should-handle-error.ts  (index.mdx:146-151 verbatim)        -> results-should-handle-error.json
./run.sh bun-tab              # node index-bun-tab.ts  (Bun tab under Node, no adapter)                -> results-bun-tab.json
./run.sh static               # node index-static.ts  (traceLifecycle: "static")                       -> results-static.json
./run.sh errors-only          # node index-errors-only.ts  (no tracesSampleRate)                       -> results-errors-only.json
./run.sh import-flag          # node --import ./instrument.mjs app.mjs  (not in the guide)             -> results-import-flag.json
./run.sh cjs                  # node index.cjs  (require(), not in the guide)                          -> results-cjs.json
```

Each run starts the sink on `127.0.0.1:4732` and one app on `127.0.0.1:4733` (both checked free first), curls
the routes in order (`/`, `/users/42`, `/debug-sentry`, `/error-404`, `/error-503`, `/error-status-503`,
`/debug-log`, `/debug-sentry-tracing` with `--max-time 3`, `/sentinel`), records whether each response carried a
`sentry-trace` header, polls `/__items` until the sentinel event, the sentinel's server span (skipped for
`errors-only`) and the log batch have all arrived (hard deadline 60 s, no fixed sleeps), writes
`results-<variant>.json` via `summarize.mjs`, and kills both processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `index.mdx:24-25`: Elysia `v1.4.0+`, "Bun or Node.js 18+ (with @elysiajs/node adapter)".
- `index.mdx:46-48`: `@elysiajs/opentelemetry` is not needed, "`@sentry/elysia` handles all instrumentation natively".
- `index.mdx:60`: `npm install @sentry/elysia @elysiajs/node`.
- `index.mdx:77,105-127`: `Sentry.init()` before creating the app, `Sentry.withElysia(new Elysia({ adapter: node() }))` before routes, `.get("/").listen(3000)` in `index.ts`.
- `index.mdx:139-140`: "captures 5xx errors automatically via a global `onError` hook. Client errors (3xx/4xx) are not captured by default"; `:146-151` `shouldHandleError: (context) => context.set.status === 500 || context.set.status === 503`.
- `index.mdx:177-184`: "Add the following route to your app" after the config snippet, `app.get("/debug-sentry", ...)` throws and creates an issue.
- `index.mdx:198-216`: "update the previous code snippet by starting a trace", `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })`.
- `what-instrumentation-provides/javascript.elysia.mdx:3-7`: spans for every lifecycle phase; Handle uses `op: 'request_handler.elysia'`, the others `op: 'middleware.elysia'`; "Transactions use parameterized route names"; "Named function handlers show their function name in spans; arrow functions show as `anonymous`"; `:12` Node.js uses Node's HTTP instrumentation for root spans and renames with the route.
- `enable-stream-mode/javascript.elysia.mdx:5,17,25`: opt in with `traceLifecycle: 'stream'`; `'static'` is "the default" and "transaction mode".
- `v10-to-v11/index.mdx:392,436,438`: Elysia `handler` spans resolve a route, the handler function name is in `code.function.name`; ops `handler` and `middleware`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the eight develop tarballs plus `elysia@1` and `@elysiajs/node@1` succeeded (`added 79 packages in
4s`). `node_modules/@sentry` holds `bun bundler-plugins conventions core elysia node opentelemetry
server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*`
entry except `@sentry/conventions@0.20.0`. **Holds.** `@sentry/elysia` depends on `@sentry/bun` (not
`@sentry/node`), which pulls `@sentry/node` and `@sentry/server-utils`; `elysia` is a non-optional peer
dependency (`^1.4.0`). No `@opentelemetry/*` package other than `api` is installed, so the alert at
`index.mdx:46-48` holds: everything below came without `@elysiajs/opentelemetry`.

`@sentry/elysia` `engines` is `>=20.19.0 <22.0.0 || >=22.12.0 <23.0.0 || >=23.2.0` (`node_modules/@sentry/elysia/package.json`),
same for `@sentry/bun` and `@sentry/node`; the prerequisite "Node.js 18+" (`index.mdx:25`) is below the engine
range. Not run on Node 18 (only `v26.5.0` here).

Exports the snippets use, checked in `node_modules/@sentry/elysia/build/types/{index,sdk,withElysia}.d.ts`:

| Export | Status on develop |
| --- | --- |
| `init(options?)` | exists (`sdk.d.ts`), returns `NodeClient \| undefined`; `ElysiaOptions = BunOptions` (`types.d.ts`) |
| `withElysia(app, { shouldHandleError?: (context: ErrorContext) => boolean })` | exists (`withElysia.d.ts`), returns the same app |
| `Sentry.startSpan`, `Sentry.logger`, `Sentry.captureMessage` | exist (re-exported from `@sentry/bun`) |
| `@deprecated` | none in the three Elysia type files; the deprecated names in `index.d.ts` (`setupKoaErrorHandler`, `setupExpressErrorHandler`, ...) are `@sentry/bun` re-exports no Elysia page uses |
| `@sentry/node/preload`, `import "./instrument";` | not reachable from this guide (no install-method page renders for `javascript.elysia`); their status is in `../express/README.md` and `../koa/README.md` |

### Step 2, Configure and run (`guide`, `results-guide.json`)

`index.ts` is the Node.js tab verbatim plus `tunnel`, `debug: true`, the port from `APP_PORT`. `node index.ts`
runs it (Node's type stripping), preceded by
`[MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://$REPRO/quickstarts/elysia/index.ts is not specified and it doesn't parse as CommonJS. Reparsing as ES module ... add "type": "module" to package.json`.
The guide never says how to start the file on Node, nor that `"type": "module"` avoids the warning.

Identity read off the envelopes: **`sdk.name: sentry.javascript.bun`, `10.67.0`, `contexts.runtime: { name: "bun",
version: "unknown" }`**, on Node `v26.5.0`, in every variant (`sdk_names_on_envelopes: ["sentry.javascript.bun"]`).
`build/esm/sdk.js` spreads `userOptions` into `options` before `applySdkMetadata(userOptions, "elysia", ...)`, so the
Elysia metadata never reaches the client and `@sentry/bun`'s `_init` then stamps `bun` and
`typeof Bun !== "undefined" ? Bun.version : "unknown"`; the `../../cells/M-elysia-deno/README.md` saw the same on Deno.
`debug: true` prints `SDK initialized from ESM`, `Registered diagnostics-channel injection via Module.registerHooks()`,
`[Sentry] Runtime hook registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per run
`Discarded session because of missing or non-string release` (`../node/README.md`). **42 integrations** with
`tracesSampleRate: 1.0`:

```
EventFilters FunctionToString LinkedErrors RequestData Console Http Fetch OnUncaughtException OnUnhandledRejection
ContextLines Context Modules ProcessSession Express Fastify Hapi Koa BunHttpServer Graphql Mongo Mongoose Mysql
Mysql2 Redis Postgres Prisma Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI
OpenAI Anthropic_AI Google_GenAI PostgresJs Firebase SpanStreaming
```

`BunHttpServer` is installed on Node (only `BunServer` is filtered out by `getDefaultIntegrations`); `Fetch` is
`@sentry/bun`'s. Without `tracesSampleRate` (`errors-only`): **19 integrations** (`... ProcessSession Express
Fastify Hapi Koa BunHttpServer`), no `span` envelope, the same error events with route-named `transaction`.

Error event for `/debug-sentry` (HTTP 500):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.elysia.on_error","handled":false,
 "level":"error","sdk":"sentry.javascript.bun","sdk_version":"10.67.0","runtime":"bun","runtime_version":"unknown",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4733/debug-sentry","method":"GET","hasData":false,"headers":{"accept":"*/*","host":"127.0.0.1:4733","user-agent":"curl/8.7.1"}},
 "user":{"ip_address":"127.0.0.1"},"environment":"production"}
```

**Six** error events per run: `/debug-sentry`, `/debug-sentry-tracing`, `/error-503` (`Error: custom 503`),
`/error-status-503` (**`Error: 'ElysiaCustomStatusResponse' captured as exception with keys: code, response`**,
the object `status(503, ...)` throws is not an `Error`), the sentinel, and **`Error: NOT_FOUND` for the unmatched
`/nope` probe** (`transaction: GET /nope`, HTTP 404). `/error-404` (`set.status = 404` then throw) was not captured.
`probe-status.out` shows why: the default filter reads `context.set.status`, which is `200` for Elysia's
`NotFoundError` (`code: NOT_FOUND`, `error.status: 404`) and `500` for anything thrown via `status(...)`
(`code: 503` or `404`, class `ElysiaCustomStatusResponse`), so a `throw status(404, ...)` is captured too although
the client gets a 404. Only the first `NOT_FOUND` per process arrives: Elysia's compiled handler reuses one
`NotFoundError` instance (`node_modules/elysia/dist/compose.mjs`, one `new NotFoundError`), and every later
unmatched request logs `Not capturing exception because it's already been captured.` (`app-verify-verbatim.log`,
eight 404s, one event). `duplicate_error_events: []`.

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle: stream`
on every span); **no `transaction` envelope in any streamed variant**. The root span comes from `@sentry/node`'s
HTTP instrumentation (`origin: auto.http.http_server`, op `http.server`), renamed by `withElysia`'s
`onAfterHandle`/`onError` hooks (`sentry.segment.name.source=route`, `http.route`); the unmatched `/nope` stays
`GET` with `source=url`:

```
GET                       [source=url   status=error 404]   (readiness probe /nope)
GET /                     [source=route status=ok    200]
GET /users/:id            [source=route status=ok    200]
GET /debug-sentry         [source=route status=error 500]
GET /error-404            [source=route status=error 404]
GET /error-503            [source=route status=error 503]
GET /error-status-503     [source=route status=error 503]
GET /debug-log            [source=route status=ok    200]
GET /debug-sentry-tracing [source=route status=error 500]
GET /sentinel             [source=route status=ok    200]
```

Child spans per request, all `origin: auto.http.elysia`, 11 to 12 per request: `middleware` spans named by the
phase (`Request`, `Parse`, `Transform`, `BeforeHandle`, `AfterHandle`, `MapResponse`, `AfterResponse`, `Error`),
one `middleware` span per hook named by the function (`auditHook`, and the SDK's own `sentryOnRequest`,
`sentryOnAfterHandle`, `sentryOnError`), and one `handler` span named by the route (`/users/:id`,
`http.route: /users/:id`). Ops are `handler` and `middleware`, as `v10-to-v11/index.mdx:436-438` says, not
`request_handler.elysia`/`middleware.elysia` (`what-instrumentation-provides/javascript.elysia.mdx:5`). **The named
handler `getUser` appears nowhere**: no `code.function.name` attribute in any span of `results-guide.json` (0
matches), and the handler span is named by the route, so neither `what-instrumentation-provides:7` nor
`v10-to-v11:392` ("handler function name moved to `code.function.name` for Elysia") is observed on Node. Every
child that ends before the route is resolved (`Request` through the `handler` span itself) carries
`sentry.segment.name: GET`; only `AfterHandle`, `MapResponse`, `AfterResponse` and the segment carry
`GET /users/:id`. `ContextLines` logs `Failed to read file: eval at composeHandler (.../elysia/dist/compose.mjs:988:12)`
and `Could not find line 23 in file eval at ...` ten times per run for Elysia's compiled handler frames (the
events still have `hasContextLine: true` from the user frames).

`sentry-trace` and `baggage` response headers are set on 200 responses only (`/`, `/users/42`, `/debug-log`,
`/sentinel`); error responses have none because the header hook is `onAfterHandle`. Log item:
`{"type":"log","items":["info: User example action completed"]}`. Sentinel: `captureMessage` event,
`mechanism: generic`, `handled: true`, `transaction: GET /sentinel`.

### Step 3, Verify: the route added where the guide says is never served (`verify-verbatim`)

`index.mdx:177` says "Add the following route to your app" after a config snippet that ends in `.listen(3000)`
(`:124-126`). `index-verify-verbatim.ts` pastes `app.get("/debug-sentry", ...)` (and a `/sentinel` route) after
that chain. The app starts, but **every route added after `.listen()` returns 404** (`/debug-sentry` 404, nine of
ten steps 404), "My first Sentry error!" is never thrown, and the only event in the sink is the one
`Error: NOT_FOUND`, which a new user would take for the expected issue. Chaining the route before `.listen()`
(`guide`) gives the event above. `results-verify-verbatim.json`.

`/debug-sentry-tracing` (`index.mdx:205-216`, chained): HTTP 500 after ~103 ms, error event
`mechanism: auto.http.elysia.on_error`, `transaction: GET /debug-sentry-tracing`, plus a `test` span
`My First Test Transaction` (`status: error`, `origin: manual`, `sentry.segment.name: GET`) inside the
`GET /debug-sentry-tracing` segment's `span` envelope. There is no transaction anywhere in the sink; the verify
text ("starting a trace"), `what-instrumentation-provides:6` ("Transactions use parameterized route names") and
`enable-stream-mode:25` (`'static'` "the default", "transaction mode") do not match: with `traceLifecycle: "static"`
(`static`) the same run sends **7 `transaction` envelopes and 0 `span` envelopes**, route-named (`GET /users/:id`,
...), the 404 requests dropped (`/nope`, `/error-404`; `dropSpansForIncomingRequestStatusCodes` applies to
transactions only, the streamed variants send the 404 segments).

### Step 4, Manual variants

- **`should-handle-error`** (`index.mdx:146-151` verbatim): `NOT_FOUND` is gone (`set.status` 200 fails
  `=== 500 || === 503`), `/debug-sentry` (500), `/error-503` and `throw status(503)` (`set.status` 500) are
  captured, 5 events. The guide's own snippet is the workaround for the 404 issue above. `results-should-handle-error.json`.
- **`bun-tab`** (`index.mdx:82-103`, the expanded default tab, under Node): `Error: WebStandard does not support
  listen, you might want to export default Elysia.fetch instead` at `.listen()` (`elysia/dist/adapter/web-standard/index.mjs:141`),
  captured by `OnUncaughtException`, process exits. The guide is right to require the adapter. `results-bun-tab.json`.
- **`errors-only`**: 19 integrations, 0 spans, 6 events with route-named `transaction`. `results-errors-only.json`.
- **`import-flag`** (`node --import ./instrument.mjs app.mjs`, not in the guide): identical to `guide` (6 events,
  10 span envelopes, same child spans, `SDK initialized from ESM`). Init order does not matter here because the
  root span comes from the diagnostics-channel HTTP instrumentation and `withElysia` hooks the app instance.
  `results-import-flag.json`.
- **`cjs`** (`require("@sentry/elysia")`, `require("elysia")`, `require("@elysiajs/node")`, not in the guide):
  works, `SDK initialized from CommonJS`, same shapes for the routes it registers. `results-cjs.json`.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/elysia @elysiajs/node` (`index.mdx:60`) | **yes** (`elysia` itself comes in as a peer dependency) |
| "Bun or Node.js 18+" (`index.mdx:25`) | **stale**: `engines` starts at Node `20.19.0` (Node 18 not run) |
| `@elysiajs/opentelemetry` not needed (`index.mdx:46-48`) | **yes** |
| `Sentry.init()` then `withElysia(new Elysia({ adapter: node() }))` in `index.ts` (`index.mdx:77,105-127`) | **yes**, with a `MODULE_TYPELESS_PACKAGE_JSON` warning unless `"type": "module"` is set; the guide never says `node index.ts` |
| 5xx captured via the global `onError` hook (`index.mdx:139`) | **yes** (`auto.http.elysia.on_error`, `handled: false`, `transaction` and request data present) |
| "Client errors (3xx/4xx) are not captured by default" (`index.mdx:139`) | **no**: the first unmatched route per process is captured as `Error: NOT_FOUND`, and every `throw status(4xx, ...)` is captured as `'ElysiaCustomStatusResponse' captured as exception` (`set.status` is 200 / 500 when the hook runs); only `set.status = 4xx` before a throw is skipped |
| `shouldHandleError` snippet (`index.mdx:146-151`) | **yes**, and it suppresses the `NOT_FOUND` issue |
| Verify route added "to your app" after the config snippet (`index.mdx:177-184`) | **no**, a route added after `.listen()` returns 404 under `@elysiajs/node`; chained before `.listen()` it creates the issue |
| Tracing verify snippet (`index.mdx:205-216`) | **yes** (chained); the span is a `test` child in a `span` envelope, there is no transaction |
| Handle `op: 'request_handler.elysia'`, others `op: 'middleware.elysia'` (`what-instrumentation-provides:5`) | **no**, ops are `handler` and `middleware` (matches `v10-to-v11:436-438`) |
| "Transactions use parameterized route names" (`what-instrumentation-provides:6`) | **no** by default: `span` envelopes; route-named `transaction` envelopes only with `traceLifecycle: "static"` |
| Named handlers show their function name, `code.function.name` for Elysia (`what-instrumentation-provides:7`, `v10-to-v11:392`) | **no** on Node: handler span named by the route, no `code.function.name` anywhere |
| Node.js root spans from Node's HTTP instrumentation, renamed with the route (`what-instrumentation-provides:12`) | **yes** (`origin: auto.http.http_server`, `source=route`) |
| `'static'` is the default, `'stream'` needs opt-in (`enable-stream-mode:5,25`) | **no**, every span carries `sentry.trace_lifecycle: stream` without the option |
| `BrowserTracing` creates a transaction per page load (`what-instrumentation-provides:1`) | **not applicable** to a server SDK page |
| Events carry the Elysia SDK identity (`index.mdx:4` `sentry.javascript.elysia`) | **no**, `sentry.javascript.bun`, runtime `bun` `unknown` on Node |

## Files

`package.json`, `routes.ts`, `index.ts`, `index-verify-verbatim.ts`, `index-should-handle-error.ts`,
`index-bun-tab.ts`, `index-static.ts`, `index-errors-only.ts`, `instrument.mjs`, `app.mjs`, `index.cjs`,
`probe-status.ts` (`probe-status.out`, `probe-status.log`), `run.sh`, `summarize.mjs`, `sink.mjs` (a copy of
`../koa/sink.mjs`), `results-<variant>.json`, `app-<variant>.log`, `sink-<variant>.log`.
