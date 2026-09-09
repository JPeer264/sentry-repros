# QS-nestjs, Nest.js getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` and `@nestjs/schedule` `12.0.1`, `reflect-metadata`
`0.2.2`, `rxjs` `7.8.2`, `typescript` `7.0.2` and `@types/node` from the registry; compiled with plain `tsc`
(no Nest CLI). All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

The Node.js run in `../node/README.md` covers the plain-Node install variants, the Express (`../express/README.md`),
Fastify (`../fastify/README.md`) and Koa (`../koa/README.md`) runs cover the same Node-only findings (the
`--require` banner, the removed `@sentry/node/preload` entry, the extensionless ESM import, the missing-release
session warning, the `@opentelemetry/instrumentation-*` claims). Only their Nest.js status is recorded here.

## What it reproduces

A new user following the Nest.js guide end to end: install `@sentry/nestjs`, write `instrument.ts`, import it
first in `main.ts`, add `SentryModule.forRoot()` to `AppModule`, add `SentryGlobalFilter` as `APP_FILTER`
("Capture Nest.js Errors"), compile with `tsc` to CommonJS (the guide's `install/index.mdx:20` default) and run
the verify step. One Nest app (`src/`) with one controller and these routes:

| Route | What it does | Snippet |
| --- | --- | --- |
| `/users/:id` | returns `{ id }` plus the result of `MyService.myFunction()` decorated with `@SentryTraced()` | `features/sentry-traced-decorator.mdx:14-23` verbatim (made `@Injectable()`); route repro-only |
| `/debug-sentry` | `@Get("/debug-sentry") getError() { throw new Error("My first Sentry error!"); }` | `getting-started-verify/javascript.nestjs.mdx:13-16`, verbatim |
| `/debug-sentry-tracing` | the tracing verify snippet: `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, () => { setTimeout(() => { throw ... }, 99) })` | `getting-started-verify/javascript.nestjs.mdx:36-49`, verbatim except the path (only hit by the `verify-tracing` variant) |
| `/error-404`, `/error-503`, `/error-500-http` | `throw new NotFoundException("custom 404")`, `ServiceUnavailableException("custom 503")`, `new HttpException("custom 500", 500)` | repro-only, to check the `HttpException` claim for 4xx and 5xx |
| `/debug-log` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` (the Nest guide never renders it, see below) |
| `/cron` | calls `MyCronService.handleCron()`, decorated with `@Cron('* * * * *')` and `@SentryCron('my-monitor-slug', {...})` | `includes/nestjs-sentry-cron-decorator.mdx:11-30` verbatim; `ScheduleModule` is not registered, so the job only runs when the route calls it |
| `/sentinel` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span, the log batch and the two check-ins instead of sleeping | repro-only |

A class middleware (`AuditMiddleware`, `NestModule.configure`) is applied to the controller so middleware spans are
visible. The readiness probe hits `/nope` (unmatched route). The only deviation from the guide's `main.ts` is
`app.listen(Number(process.env.APP_PORT) || 3000)` instead of `app.listen(3000)`.

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.nestjs`), then
`fallbackGuide` (`javascript.node`, from `guides/nestjs/index.mdx:5`), then platform (`javascript`), then
`_default`. The guide inlines its `main.ts` / `app.module.ts` snippets; `platform-includes/getting-started-use/javascript.nestjs.mdx`
holds the same two snippets but no page renders it.

| Step | Renders from |
| --- | --- |
| `docs/platforms/javascript/guides/nestjs/index.mdx:14` prerequisites | `platform-includes/getting-started-prerequisites/javascript.node.mdx:1-16` (fallback guide; no nestjs file) |
| `index.mdx:22-24` onboarding options | `error-monitoring`, `performance`, `profiling` (no `logs` option) |
| `index.mdx:26` features expandable | `includes/quick-start-features-expandable.mdx` |
| `index.mdx:39` install | `platform-includes/getting-started-install/javascript.nestjs.mdx:3-13` (`npm install @sentry/nestjs --save`, yarn, pnpm), `:19-29` with `@sentry/profiling-node` |
| `index.mdx:58` config | `platform-includes/getting-started-config/javascript.nestjs.mdx:1-33` (`instrument.ts`) |
| `index.mdx:75-89` apply, `main.ts` | inline: `import "./instrument";` first, `NestFactory.create(AppModule)`, `app.listen(3000)` |
| `index.mdx:102-117` apply, `app.module.ts` | inline: `SentryModule.forRoot()` from `@sentry/nestjs/setup` in `imports` |
| `index.mdx:125` source maps | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx` (not run) |
| `index.mdx:129` capture errors | `platform-includes/getting-started-capture-errors/javascript.nestjs.mdx:1-158` (`@SentryExceptionCaptured()` at `:17-28`, `SentryGlobalFilter` as `APP_FILTER` at `:45-60`, `Sentry.captureException` in a typed filter at `:77-90`, WebSocket and microservice expandables at `:96-158`) |
| `index.mdx:131-133` async context | `guides/nestjs/features/async-context.mdx:10-30` (`Sentry.withIsolationScope` in a `@Cron()` handler, not run) |
| `index.mdx:137` data collection | `platform-includes/getting-started-data-collection/javascript.mdx` (not run) |
| `index.mdx:143` verify | `platform-includes/getting-started-verify/javascript.nestjs.mdx:12-17` (issues), `:35-50` (tracing), `:58-62` (logs, only under a `logs` option the page does not offer) |
| `index.mdx:149` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| `index.mdx:166` install methods | `guides/nestjs/install/{index,commonjs,esm,esm-without-import}.mdx` |
| `features/sentry-traced-decorator.mdx`, `features/sentry-cron-decorator.mdx:6` | inline `:14-23`; `includes/nestjs-sentry-cron-decorator.mdx:11-30` |
| `features/event-emitter.mdx`, `features/logging.mdx` | inline (not run: no `@nestjs/event-emitter`; the `forceConsole` logger note not run) |
| Nest integration page | `docs/platforms/javascript/common/configuration/integrations/nest.mdx:1-31` (no includes) |
| GraphQL integration page | `docs/platforms/javascript/common/configuration/integrations/graphql.mdx` (lists `javascript.nestjs` at `:15`; no Nest-specific text, not run) |
| Nest automatic instrumentation page | `guides/nestjs/tracing/instrumentation/automatic-instrumentation.mdx:6` -> `includes/node-automatic-instrumentation.mdx` (no Nest mention) |

## Install

```bash
cd $REPRO/quickstarts/nestjs
npm install            # package.json pins the seven develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus @nestjs/*@12, reflect-metadata, rxjs, typescript@7
npx tsc -p tsconfig.json       # -> dist/ (CommonJS)
npx tsc -p tsconfig-esm.json && echo '{"type":"module"}' > dist-esm/package.json   # -> dist-esm/ (ESM, for the esm-verbatim variant)
```

## Run

```bash
cd $REPRO/quickstarts/nestjs
./run.sh cjs               # node dist/main.js  (guide: import "./instrument" first, SentryModule.forRoot() + SentryGlobalFilter) -> results-cjs.json
./run.sh no-filter         # node dist/main-no-filter.js  (SentryModule.forRoot() only, before "Capture Nest.js Errors")          -> results-no-filter.json
./run.sh no-module         # node dist/main-no-module.js  (SentryGlobalFilter only, no SentryModule.forRoot())                    -> results-no-module.json
./run.sh custom-filter     # node dist/main-custom-filter.js  (@SentryExceptionCaptured() on a custom catch-all filter)           -> results-custom-filter.json
./run.sh import-flag       # node --import ./dist/instrument.js dist/main-no-instrument.js                                      -> results-import-flag.json
./run.sh node-options      # NODE_OPTIONS="--import ./dist/instrument.js" node dist/main-no-instrument.js                       -> results-node-options.json
./run.sh errors-only       # node dist/main-errors-only.js  (config without tracesSampleRate)                                    -> results-errors-only.json
./run.sh verify-tracing    # node dist/main.js, only /debug-sentry-tracing then /sentinel                                        -> results-verify-tracing.json
./run.sh esm-verbatim      # node dist-esm/main.js  (same sources emitted as ESM, import "./instrument" verbatim)                -> results-esm-verbatim.json
./run.sh esm-start-script  # sh -c '--import ./instrument.mjs nest start'  (install/esm.mdx:35 verbatim)                        -> results-esm-start-script.json
```

Each run starts the sink on `127.0.0.1:4730` and one app on `127.0.0.1:4731` (both checked free first), curls
the routes in order (`/users/42`, `/debug-sentry`, `/error-404`, `/error-503`, `/error-500-http`, `/debug-log`,
`/cron`, `/sentinel`), polls `/__items` until the sentinel event, the sentinel's server span (skipped for
`errors-only`), the log batch and both check-ins have arrived (hard deadline 60 s, no fixed sleeps), writes
`results-<variant>.json` (steps with HTTP codes, console output with the installed integrations, the compact sink
items, the raw span payloads and a computed verdict) via `summarize.mjs`, and kills both processes. Machine paths
are replaced by `$REPRO`.

## Expected (what the guide claims)

- `getting-started-install/javascript.nestjs.mdx:3-13`: `npm install @sentry/nestjs --save`.
- `getting-started-config/javascript.nestjs.mdx:1-33`: `instrument.ts` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `index.mdx:70-89`: import `instrument.ts` "before any other modules" in `main.ts`.
- `index.mdx:97-117`: "add the `SentryModule` as a root module to your main module" (`SentryModule.forRoot()`).
- `getting-started-capture-errors/javascript.nestjs.mdx:1-2`: "By default, Sentry only captures unhandled exceptions that aren't caught by an error filter. Additionally, `HttpException`s (including derivatives) aren't captured by default".
- `getting-started-capture-errors/javascript.nestjs.mdx:12-28`: `@SentryExceptionCaptured()` on a custom catch-all filter's `catch()`.
- `getting-started-capture-errors/javascript.nestjs.mdx:40-60`: without a catch-all filter, `SentryGlobalFilter` as `APP_FILTER` "before any other exception filters".
- `getting-started-verify/javascript.nestjs.mdx:7,13-16`: "Add the following route to your application", `@Get("/debug-sentry") getError() { throw ... }`.
- `getting-started-verify/javascript.nestjs.mdx:30,36-49`: "update the previous code snippet by starting a performance trace to measure the time it takes for the execution of your code", `Sentry.startSpan(...)` whose callback throws inside `setTimeout(..., 99)`.
- `install/index.mdx:20`: "Nest.js transpiles to CJS by default, so you should follow the CommonJS installation instructions".
- `install/esm.mdx:31-42`: `"start": "--import ./instrument.mjs nest start"`, or `NODE_OPTIONS="--import ./instrument.mjs" npm run start`.
- `install/esm-without-import.mdx:18-20,41-51`: a first-line `import "./instrument";` in `main.ts` instruments "only native Node.js APIs", but "ensures that Sentry can automatically instrument all modules in your application".
- `features/sentry-traced-decorator.mdx:8`: `@SentryTraced` "will create spans whenever the method it decorates is invoked".
- `includes/nestjs-sentry-cron-decorator.mdx:3-8`: `@SentryCron` sends "check-ins to Sentry before and after each cron job run", must be applied after `@Cron`.
- `integrations/nest.mdx:3,19-21`: "Adds performance instrumentation for Nest.js. (default)", "enabled by default when performance monitoring is enabled", captures spans "using `@opentelemetry/instrumentation-nestjs-core`"; `:31` Nest.js `>=4.0.0`.
- `guides/nestjs/tracing/instrumentation/automatic-instrumentation.mdx:3`: "Learn what transactions are captured after tracing is enabled in the Sentry Nest.js SDK."
- `migration/v10-to-v11/index.mdx:392`: Nest handler spans are named `Request handler`, function name in `nestjs.callback`; `:436-441` ops `handler`, `middleware`, `function` for `app_creation.nestjs`, `request_context.nestjs`, `event.nestjs`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the seven develop tarballs plus `@nestjs/{core,common,platform-express,schedule}@12`,
`reflect-metadata`, `rxjs` and `typescript@7` succeeded (`added 169 packages in 13s`). `node_modules/@sentry`
holds `bundler-plugins conventions core nestjs node opentelemetry server-runtime-injection server-utils`, all
`10.67.0`; `package-lock.json` has no registry-resolved `@sentry/*` entry except `@sentry/conventions@0.20.0`.
**Holds.** `@sentry/nestjs` declares `peerDependencies` `@nestjs/common` and `@nestjs/core` `^8 || ^9 || ^10 ||
^11 || ^12`; the tarball's `engines.node` is `>=20.19.0 <22.0.0 || >=22.12.0 <23.0.0 || >=23.2.0`, while the
prerequisites include (`javascript.node.mdx:7`) still says Node `18.0.0` or above.

Build: `tsc` 7 rejects `"moduleResolution": "node10"` (`TS5108: Option 'moduleResolution=node10' has been
removed`) and needs `"types": ["node"]` for `process`; with `experimentalDecorators`, `emitDecoratorMetadata`,
`module: commonjs` it compiles the guide's snippets without errors (tooling note, not a docs finding).

Exports the snippets use, checked in `node_modules/@sentry/nestjs/build/types/index.d.ts`,
`build/types/decorators.d.ts`, `build/types/integrations/nest.d.ts` and `node_modules/@sentry/nestjs/setup.d.ts`
(the `./setup` subpath's types):

| Export | Status on develop |
| --- | --- |
| `SentryModule.forRoot()` (`@sentry/nestjs/setup`) | exists; registers one `APP_INTERCEPTOR` (`SentryTracingInterceptor`, sets the isolation-scope transaction name from `req.route.path`) and nothing else (`build/esm/setup.js`) |
| `SentryGlobalFilter` (`@sentry/nestjs/setup`) | exists, extends `BaseExceptionFilter`; `catch()` skips anything with `getStatus`, `getResponse` and `initMessage` (every `HttpException`, any status) and `getError`+`initMessage` (Ws/Rpc exceptions), captures the rest with `mechanism.type: auto.http.nestjs.global_filter`, `handled: false`, then calls `super.catch` |
| `SentryExceptionCaptured()`, `SentryTraced(op?)`, `SentryCron(slug, config?)` (`@sentry/nestjs`) | exist |
| `nestIntegration()` | exists, name `Nest`; d.ts "Integration capturing tracing data for NestJS"; implementation subscribes to `diagnostics_channel` tracing channels injected into `@nestjs/core` (`nest-factory.js`, `router/router-execution-context.js`, `versionRange: '>=8.0.0 <13'`), `@nestjs/common` (`Injectable`, `Catch` decorators), `@nestjs/schedule` (`Cron`, `Interval`, `Timeout`, `>=2.0.0`), `@nestjs/event-emitter` and `@nestjs/bullmq` (`server-utils/build/esm/orchestrion/config/nestjs.js`) |
| `@opentelemetry/instrumentation-nestjs-core` (`integrations/nest.mdx:21`) | **not installed**: the only `@opentelemetry/*` package in `node_modules` is `api` |
| `Sentry.startSpan`, `Sentry.captureException`, `Sentry.captureMessage`, `Sentry.withIsolationScope`, `Sentry.logger.info` | exist (re-exported from `@sentry/node`) |
| `@sentry/nestjs` `exports` | `.`, `./setup`, `./package.json` only; no `preload` subpath (see `../express/README.md`) |
| `@deprecated` markers in `build/types/**` and `setup.d.ts` | none |

### Step 2, Configure

`instrument.ts` is the config snippet verbatim plus `tunnel` and `debug: true`. `debug: true` prints no SDK name
or version; identity was read off the envelopes: `sentry.javascript.nestjs` `10.67.0`, runtime `node`
`v26.5.0`. **47 integrations installed** with `tracesSampleRate: 1.0` (the 46 of the Express/Fastify/Koa runs plus
`Nest`, which is installed first):

```
Nest EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

With the "error-monitoring" option only (no `tracesSampleRate`, `errors-only`), **24 integrations**, and `Nest`
is still one of them:

```
Nest EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `[instrumentation:nestjs] subscribing to @nestjs channels`, `SDK
initialized from CommonJS` (in every variant, including `--import`, since the compiled files are CJS), `[Sentry]
Runtime hook registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per run `Sentry
Logger [warn]: Discarded session because of missing or non-string release` (`../node/README.md`). The
`SentryTracingInterceptor`'s "Isolation scope is still the default isolation scope" warning never printed
(`isolation_scope_warning: 0` in every variant). No deprecation output anywhere.

### Step 3, Apply instrumentation (variant `cjs`, `results-cjs.json`)

Error event for `/debug-sentry` (HTTP 500 from `BaseExceptionFilter`):

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.nestjs.global_filter","handled":false,
 "level":"error","sdk":"sentry.javascript.nestjs","sdk_version":"10.67.0","runtime":"node","runtime_version":"v26.5.0",
 "hasContextLine":true,"transaction":"GET /debug-sentry",
 "request":{"url":"http://127.0.0.1:4731/debug-sentry","method":"GET","hasData":false,"headers":{"host":"127.0.0.1:4731","user-agent":"curl/8.7.1","accept":"*/*"}},
 "user":{"ip_address":"::ffff:127.0.0.1"},"environment":"production"}
```

**Two** error events per run: this one and the sentinel (`captureMessage`, `mechanism: generic`, `handled: true`,
`transaction: GET /sentinel`). `NotFoundException("custom 404")`, `ServiceUnavailableException("custom 503")` and
`new HttpException("custom 500", 500)` produced HTTP 404 / 503 / 500 and **no event**, so
`getting-started-capture-errors/javascript.nestjs.mdx:2` holds for 4xx and 5xx alike: there is no status
threshold and no option to add one (`SentryGlobalFilter` takes no options; `shouldHandleError` exists for
`expressIntegration()` and `fastifyIntegration()` only, `migration/v10-to-v11/index.mdx:722`). Nest's own
`ExceptionsHandler` stderr block for the `Error` is still printed once (`nest_error_log: 1`), because
`SentryGlobalFilter` delegates to `BaseExceptionFilter`. No error was captured twice.

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`, `sentry.trace_lifecycle: stream`
on every span); **no `transaction` envelope was sent for any route in any variant**. Segment names come from the
matched route (`sentry.segment.name.source=route`, `http.route` set, op `http.server`, origin
`auto.http.http_server`); the unmatched `/nope` probe is `GET` with `source=url`. One extra segment is sent at
start-up, before any request:

```
Create Nest App             [op=function source=custom nestjs.type=app_creation nestjs.module=AppModule nestjs.version=12.0.1]   (NestFactory.create)
GET                         [source=url   status=error 404]   (readiness probe /nope)
GET /users/:id              [source=route status=ok    200]
GET /debug-sentry           [source=route status=error 500]
GET /error-404              [source=route status=error 404]
GET /error-503              [source=route status=error 503]
GET /error-500-http         [source=route status=error 500]
GET /debug-log              [source=route status=ok    200]
GET /cron                   [source=route status=ok    200]
GET /sentinel               [source=route status=ok    200]
```

Child spans of `GET /users/:id` (`results-cjs.json` `spansRaw`), in the order they were sent:

| Span | op | origin | Attributes |
| --- | --- | --- | --- |
| `AuditMiddleware` | `middleware` | `auto.middleware.nestjs` | none besides the segment name |
| `/users/:id` (twice, identical) | `handler` | `auto.http.express` | `express.type: request_handler`, `express.name` and `http.route: /users/:id` |
| `urlencodedParser`, `jsonParser`, `<anonymous>` | `middleware` | `auto.http.express` | `express.type: middleware` (Nest's own body parsers and the Nest-registered Express layer) |
| `Request handler` | `handler` | `auto.http.nestjs` | `nestjs.type: handler`, `nestjs.callback: getUser`, `nestjs.version: 12.0.1` |
| `AppController.getUser` | `function` | `auto.http.nestjs` | `nestjs.type: request_context`, `nestjs.controller`, `nestjs.callback`, `http.route: /users/:id` |
| `myFunction` | `function` | `auto.function.nestjs.sentry_traced` | none (`@SentryTraced()`) |

`/debug-sentry` additionally has a `SentryGlobalFilter` span (op `middleware`, origin
`auto.middleware.nestjs.exception_filter`) and `Request handler` / `AppController.getError` with `status: error`.
This matches `migration/v10-to-v11/index.mdx:392,436-441` (`Request handler`, `nestjs.callback`, ops `handler`,
`middleware`, `function`). Every request carries two identical Express `handler <route>` spans (same name, attributes and parent); the cause
was not investigated. The guide does not mention that Nest apps get the Express spans on top of the Nest ones.

Log item: `{"type":"log","items":["info: User example action completed"]}` (logs are on without any option in this
build, although the Nest guide offers no `logs` onboarding option). Check-ins for `/cron`: `in_progress` with
`monitor_config` `{schedule: {type: crontab, value: "* * * * *"}, checkin_margin: 2, max_runtime: 10, timezone:
America/Los_Angeles}` followed by `ok` with a `duration`, both `monitor_slug: my-monitor-slug`, so the
`@SentryCron` snippet works when applied after `@Cron` and without `ScheduleModule` (the decorator wraps the method
itself). No `event.nestjs` spans were produced (no `@nestjs/event-emitter` in the app).

### Step 4, Verify: the issue snippet works, the tracing snippet kills the server

`/debug-sentry` (`getting-started-verify/javascript.nestjs.mdx:13-16`) gives the event above. The snippet is a
bare decorated method in a `javascript` code block; it needs a controller class around it and, for the tracing
version, `import * as Sentry from "@sentry/nestjs"`, neither of which the verify page shows.

`/debug-sentry-tracing` (`getting-started-verify/javascript.nestjs.mdx:36-49`, variant `verify-tracing`,
`results-verify-tracing.json`): the request returns **HTTP 200** after 3 ms (the handler returns `undefined`,
Nest answers with an empty 200), a `test` span `My First Test Transaction` with `status: ok` arrives as a child of
`GET /debug-sentry-tracing` inside a `span` envelope, and 99 ms later the `throw` inside `setTimeout` is an
uncaught exception: the SDK captures it (`mechanism: auto.node.onuncaughtexception`, `handled: false`,
`transaction: GET /debug-sentry-tracing`, request data present), prints `Error: My first Sentry error! at
Timeout._onTimeout (dist/app.controller.js:77:23)`, flushes, and **the process exits** (`app_alive_at_end: false`;
the `/sentinel` request sent before the timer fired was the last one served). The page says the snippet measures
"the time it takes for the execution of your code"; it crashes a Nest.js server on every hit, and no Nest filter
sees the error because it is thrown outside the request pipeline. The span is named "My First Test Transaction"
but there is no transaction anywhere in the sink.

### Step 5, Manual setup variants

`cjs`, `no-module`, `custom-filter`, `import-flag`, `node-options` all produced **the same item shapes**: 2 events,
10 `span` envelopes, 1 `log`, 2 `check_in`, 47 integrations, route-named segments, the Nest and Express child
spans listed above, `/debug-sentry` captured with `auto.http.nestjs.global_filter` (or
`auto.function.nestjs.exception_captured`), HTTP exceptions never captured.

- **`no-filter`** (`index.mdx:102-117` only, `SentryModule.forRoot()` without `SentryGlobalFilter`, the state a
  user is in after "Apply Instrumentation to Your App" and before "Capture Nest.js Errors"): **no controller error
  is captured**. 1 event (the sentinel); `/debug-sentry` is only logged by Nest's default `ExceptionsHandler`
  (HTTP 500). Spans, route names and check-ins are unchanged. `getting-started-capture-errors/javascript.nestjs.mdx:1`
  ("By default, Sentry only captures unhandled exceptions that aren't caught by an error filter") is literally
  true, but in a Nest app every exception is caught by the built-in filter, so nothing is captured until
  `SentryGlobalFilter` or `@SentryExceptionCaptured()` is added. `results-no-filter.json`.
- **`no-module`** (`SentryGlobalFilter` without `SentryModule.forRoot()`): identical to `cjs` in every check,
  including `transaction: GET /debug-sentry` on the event and route-named segments. On this build
  `SentryModule.forRoot()` has no observable effect: the route name is set by the HTTP instrumentation before the
  interceptor runs. The guide presents the module as a required step without saying what it does.
  `results-no-module.json`.
- **`custom-filter`** (`getting-started-capture-errors/javascript.nestjs.mdx:17-28`, `@SentryExceptionCaptured()`
  on `YourCatchAllExceptionFilter`, registered as `APP_FILTER`, body sends the status as JSON): `/debug-sentry`
  captured with `mechanism: auto.function.nestjs.exception_captured`, `handled: false`, `transaction: GET
  /debug-sentry`; the 404 / 503 / 500 `HttpException`s are skipped by the same `isExpectedError` check; a
  `YourCatchAllExceptionFilter` middleware span replaces the `SentryGlobalFilter` one. Nest's own stderr error
  block is absent (`nest_error_log: 0`), the custom filter logs nothing. As printed, the
  snippet's `catch(exception, host)` has untyped parameters (fine with `strict: false`) and an empty body, so a
  request would hang until the user writes a response. `results-custom-filter.json`.
- **`import-flag`** (`node --import ./dist/instrument.js dist/main-no-instrument.js`, `install/esm.mdx:31-36`
  applied to the CJS build) and **`node-options`** (`NODE_OPTIONS="--import ./dist/instrument.js"`,
  `install/esm.mdx:38-42`): identical to `cjs`. `results-import-flag.json`, `results-node-options.json`.
- **`errors-only`** (config without `tracesSampleRate`): 24 integrations, 0 `span` envelopes, the same 2 events
  with `transaction: GET /debug-sentry` and request data, 1 log batch and both check-ins. `results-errors-only.json`.
- **`esm-verbatim`** (the same sources emitted as ESM with `"type": "module"`, `import "./instrument";` verbatim):
  the app does not start, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '$REPRO/quickstarts/nestjs/dist-esm/instrument' imported from $REPRO/quickstarts/nestjs/dist-esm/main.js`, the
  extensionless import already reported for Express, Fastify and Koa. `install/esm-without-import.mdx:43-51` shows
  exactly this `main.ts`; under the guide's CJS default it works (variant `cjs`). `results-esm-verbatim.json`.
- **`esm-start-script`** (`install/esm.mdx:35`, `"start": "--import ./instrument.mjs nest start"`, executed the
  way npm runs a script): `sh: --: invalid option`; the line has no `node` and is not a runnable command.
  `results-esm-start-script.json`.
- **`verify-tracing`**: see Step 4. `results-verify-tracing.json`.
- `install/late-initialization.mdx` is not in the Nest.js guide tree (`guides/nestjs/install/` has `index`,
  `commonjs`, `esm`, `esm-without-import` only), so the `@sentry/node/preload` finding of `../express/README.md`
  does not apply to this guide; `@sentry/nestjs` exports no `preload` subpath either.

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm install @sentry/nestjs --save` is all you need (`getting-started-install/javascript.nestjs.mdx:3-13`) | **yes** |
| `instrument.ts` snippet initializes the SDK (`getting-started-config/javascript.nestjs.mdx:1-33`) | **yes** (`sentry.javascript.nestjs` `10.67.0`) |
| `import "./instrument";` first in `main.ts` (`index.mdx:75-89`) | **yes** when compiled to CJS (`install/index.mdx:20`); **no** as ESM (`ERR_MODULE_NOT_FOUND`) |
| "add the `SentryModule` as a root module" (`index.mdx:97-117`) | **runs**, but has no observable effect on this build (`no-module` identical to `cjs`) |
| "By default, Sentry only captures unhandled exceptions that aren't caught by an error filter" (`capture-errors:1`) | **misleading**: with only `SentryModule.forRoot()` nothing is captured, Nest's built-in filter catches everything |
| `HttpException`s "aren't captured by default" (`capture-errors:2`) | **yes**, for 404, 503 and a bare 500 `HttpException`, with `SentryGlobalFilter` and with `@SentryExceptionCaptured()` |
| `@SentryExceptionCaptured()` on a custom filter (`capture-errors:17-28`) | **yes** (`auto.function.nestjs.exception_captured`) |
| `SentryGlobalFilter` as `APP_FILTER` (`capture-errors:45-60`) | **yes** (`auto.http.nestjs.global_filter`, `handled: false`, `transaction: GET /debug-sentry`, request data present) |
| Verify issue snippet (`getting-started-verify/javascript.nestjs.mdx:13-16`) | **yes** inside a controller; the snippet shows no class and no `Sentry` import |
| Tracing verify snippet "measure the time it takes for the execution of your code" (`getting-started-verify/javascript.nestjs.mdx:30,36-49`) | **no**: HTTP 200, then an uncaught exception 99 ms later exits the process; the `test` span arrives in a `span` envelope, there is no transaction |
| `"start": "--import ./instrument.mjs nest start"` (`install/esm.mdx:35`) | **no**, not a runnable command (`sh: --: invalid option`) |
| `NODE_OPTIONS="--import ./instrument.mjs"` / `--import` (`install/esm.mdx:31-42`) | **yes** on the CJS build |
| First-line import instruments "only native Node.js APIs" (`install/esm-without-import.mdx:18-20`) | **not for the CJS default**: the guide's own first-line `import "./instrument"` compiled to `require` gave the full Nest and Express spans; the ESM form does not start at all |
| `@SentryTraced` creates spans (`features/sentry-traced-decorator.mdx:8`) | **yes** (`function myFunction`, `auto.function.nestjs.sentry_traced`) |
| `@SentryCron` sends check-ins before and after (`includes/nestjs-sentry-cron-decorator.mdx:3`) | **yes** (`in_progress` with `monitor_config`, then `ok`) |
| Nest integration "enabled by default when performance monitoring is enabled" (`integrations/nest.mdx:19`) | **partial**: installed with and without tracing (24 of 24 include `Nest`) |
| Spans come from `@opentelemetry/instrumentation-nestjs-core` (`integrations/nest.mdx:21`) | **no**, the package is not installed; the SDK's own diagnostics-channel instrumentation produced every Nest span (`origin: auto.http.nestjs`, `auto.middleware.nestjs`) |
| Supported versions Nest.js `>=4.0.0` (`integrations/nest.mdx:31`) | **stale**: the build's injection range is `>=8.0.0 <13` and the peer range starts at `^8.0.0`; `12.0.1` is fully instrumented |
| "what transactions are captured" (`guides/nestjs/tracing/instrumentation/automatic-instrumentation.mdx:3`) | **no**, only `span` envelopes arrive under the default lifecycle |
| `Request handler` span, `nestjs.callback`, ops `handler` / `middleware` / `function` (`v10-to-v11/index.mdx:392,436-441`) | **yes** |
| Node `>= 18.0.0` (`getting-started-prerequisites/javascript.node.mdx:7`) | **stale**: the tarball's `engines.node` starts at `20.19.0`; only Node v26.5.0 was run |

## Files

`package.json`, `tsconfig.json`, `tsconfig-esm.json`, `src/instrument.ts`, `src/instrument-errors-only.ts`,
`src/main.ts`, `src/main-no-filter.ts`, `src/main-no-module.ts`, `src/main-custom-filter.ts`,
`src/main-no-instrument.ts`, `src/main-errors-only.ts`, `src/app.module.ts`, `src/app.module-no-filter.ts`,
`src/app.module-no-module.ts`, `src/app.module-custom-filter.ts`, `src/app.controller.ts`, `src/app.service.ts`,
`src/my.service.ts`, `src/cron.service.ts`, `src/catch-all.filter.ts`, `src/audit.middleware.ts`, `run.sh`,
`summarize.mjs`, `sink.mjs` (a copy of `../koa/sink.mjs` plus `check_in` items), `results-<variant>.json`,
`app-<variant>.log`, `sink-<variant>.log`, `dist/`, `dist-esm/`.
