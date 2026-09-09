# QS-nitro, Nitro getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
Nitro from the registry: `3.0.260415-beta` (the version the guide names) for every variant except `latest-nitro`,
which uses the registry's `latest` tag `3.0.260903-beta`. All envelopes go to a local sink via the `tunnel`
option; the Sentry auth token stays unset and the bundler plugin's telemetry is off, so nothing leaves the machine.

The Node.js run in `../node/README.md` covers the plain-Node install variants and the Express run in
`../express/README.md` the same skeleton for a framework. Findings that are Node-only (the `--require` banner,
the removed `@sentry/node/preload` entry, the missing-release session warning) are cited from there; only the
Nitro guide's own claims are recorded here.

## What it reproduces

A new user following the Nitro guide end to end: `npm install @sentry/nitro`, wrap `nitro.config.ts` with
`withSentryConfig`, create `instrument.mjs`, add the three `NODE_OPTIONS='--import ./instrument.mjs'` scripts,
build, and run the verify steps against the `node-server` preset. One Nitro app with these files under
`server/` (see "Which file each guide step renders from" for why not the project root):

| Route | File | What it does | Snippet |
| --- | --- | --- | --- |
| `/debug-sentry` | `server/routes/debug-sentry.ts` | `defineHandler(() => { throw new Error("My first Sentry error!"); })` | `guides/nitro/index.mdx:208-214`, verbatim |
| `/debug-sentry-tracing` | `server/routes/debug-sentry-tracing.ts` | the `async` handler with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" })` that throws | `index.mdx:233-249`, verbatim except the file name (the guide overwrites `routes/debug-sentry.ts`) |
| `/process-payment` | `server/routes/process-payment.ts` | `Sentry.startSpan({ name: "process-payment" }, () => {})` | `index.mdx:301-310` ("Manual Spans"), verbatim |
| `/api/users/:id` | `server/routes/api/users/[id].ts` | returns `event.context.params.id` | repro-only, parameterized route |
| `/error-404`, `/error-503` | `server/routes/error-{404,503}.ts` | `throw new HTTPError({ status, message })` from `nitro/h3` | repro-only, for the 3xx/4xx claim at `index.mdx:273,291` |
| `/debug-log` | `server/routes/debug-log.ts` | `Sentry.logger.info("User example action completed")` | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13` |
| `/outgoing` | `server/routes/outgoing.ts` | one request to the sink's `/recorder`, which records the propagation headers; uses `$fetch` when it is a global, else `fetch` | repro-only |
| `/sentinel` | `server/routes/sentinel.ts` | `Sentry.captureMessage("sentinel")`; the run polls the sink for this event, its server span and the log batch instead of sleeping | repro-only |
| (all) | `server/middleware/audit.ts` | sets an `x-audit` response header, so middleware spans are visible | repro-only |

The readiness probe hits `/nope` (unmatched route), which shows how an unrouted request is named.

## Which file each guide step renders from

The guide (`docs/platforms/javascript/guides/nitro/index.mdx`, `sdk: sentry.javascript.nitro`, `fallbackGuide:
javascript.node` at `:4-5`) is almost entirely inline. `src/components/platformContent.tsx:64-133` resolves an
include as guide (`javascript.nitro`), then `fallbackGuide` (`javascript.node`), then platform (`javascript`),
then `_default`. No include has a `javascript.nitro.mdx`.

| Step | Renders from |
| --- | --- |
| `index.mdx:23-24` prerequisites | inline: "A Nitro application (`3.0.260415-beta` or newer)", Node.js 18.19.0+ |
| `index.mdx:36` features expandable | `includes/quick-start-features-expandable.mdx:29` (Nitro listed in the server row) |
| `index.mdx:49-59` install | inline: `npm install @sentry/nitro --save` |
| `index.mdx:82-84` `.env` | inline: `SENTRY_AUTH_TOKEN=___ORG_AUTH_TOKEN___` (not created here, see Step 1) |
| `index.mdx:86-99` `nitro.config.ts` | inline: `defineNitroConfig` from `nitro/config`, `withSentryConfig(config, { org, project, authToken })` |
| `index.mdx:101-122` `vite.config.ts` tab | inline: `nitro(withSentryConfig({...}, {...}))` (not run, needs `vite` from the registry) |
| `index.mdx:139-154` `instrument.mjs` | inline: `Sentry.init({ dsn, tracesSampleRate: 1.0 })` from `@sentry/nitro` |
| `index.mdx:160-162` source maps | inline: hidden source maps, uploaded, `.map` files deleted after the build |
| `index.mdx:175-183` scripts | inline: `dev`, `preview`, `start` with `NODE_OPTIONS='--import ./instrument.mjs'` |
| `index.mdx:191` data collection | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` (the only `<PlatformContent>` on the page; no `javascript.nitro.mdx`, `javascript.node.mdx` or `_default.mdx` exist; not run) |
| `index.mdx:208-214` verify issues | inline: `routes/debug-sentry.ts` with `defineHandler` from `nitro/h3` |
| `index.mdx:233-249` verify tracing | inline: the same file with `Sentry.startSpan` |
| `index.mdx:259` logs | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24`, only under a `logs` onboarding option that `index.mdx:32-34` does not offer |
| `index.mdx:267` locate data | `includes/quick-start-locate-data-expandable.mdx:29` |
| `index.mdx:271-282` error capturing | inline: Nitro `error` hook, 3xx/4xx `HTTPError`s skipped, `enableNitroErrorHandler: false` |
| `index.mdx:284-291` automatic tracing | inline: "creates transactions", `op: 'http.server'` root spans with parameterized names, `op: 'middleware.nitro'`, `url.path.parameter.<key>` |
| `index.mdx:293-295` distributed tracing | inline: `sentry-trace`/`baggage` in `Server-Timing` |
| `index.mdx:297-310` manual spans | inline |
| `index.mdx:312-314` runtime behavior | inline: wrapper around `@sentry/node`, re-exports its full API |

`docs/platforms/javascript/guides/nitro/` holds only `index.mdx`; there is no Nitro integration page and no
`tracing/instrumentation` page.

## Install

```bash
cd $REPRO/quickstarts/nitro
npm install            # package.json pins the seven develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides"
```

`package.json` currently pins `nitro@3.0.260903-beta` (the state after the `latest-nitro` variant; it needs
`--legacy-peer-deps`, see Step 1). To reproduce the other variants set `"nitro": "3.0.260415-beta"`, run
`npm install`, then `./run.sh build`.

## Run

```bash
cd $REPRO/quickstarts/nitro
./run.sh build              # npx nitro build                                             -> build.log
./run.sh start              # npm run start  (guide script, node .output/server/index.mjs) -> results-start.json
./run.sh preview            # npm run preview (guide script, nitro preview)                -> results-preview.json
./run.sh dev                # npm run dev -- --port 4736 (guide script, nitro dev)         -> results-dev.json
./run.sh errors-only        # --import ./instrument-errors-only.mjs (no tracesSampleRate)  -> results-errors-only.json
./run.sh no-error-handler   # --import ./instrument-no-error-handler.mjs (index.mdx:277-282) -> results-no-error-handler.json
./run.sh no-import          # node .output/server/index.mjs, flag forgotten                -> results-no-import.json
./run.sh latest-nitro       # npm run start on nitro@3.0.260903-beta                       -> results-latest-nitro.json
```

`results-root-routes.json` is the first `start` run, with the guide's `routes/debug-sentry.ts` at the project
root and no `serverDir` in `nitro.config.ts` (Step 3). Each run starts the sink on `127.0.0.1:4735` and one app
on `127.0.0.1:4736` (both checked free first), curls the routes in order (`/api/users/42`, `/debug-sentry`,
`/error-404`, `/error-503`, `/debug-log`, `/process-payment`, `/outgoing`, `/debug-sentry-tracing` with
`--max-time 5`, `/sentinel`), polls `/__items` until the sentinel event, the sentinel's server span (skipped when
no `tracesSampleRate` is set) and the log batch have all arrived (hard deadline 60 s, 15 s for `no-import`, no
fixed sleeps), writes `results-<variant>.json` (steps with HTTP codes and the `Server-Timing` header, console
output with the installed integrations, the build log, the compact sink items, the raw event exceptions, the raw
span payloads and a computed verdict) via `summarize.mjs`, and kills both processes. Machine paths are replaced by
`$REPRO`.

## Expected (what the guide claims)

- `index.mdx:23`: any Nitro `3.0.260415-beta` or newer works; `:50`: `npm install @sentry/nitro --save`.
- `index.mdx:86-99`: wrapping the config with `withSentryConfig` registers the Sentry module; `:75`: source maps are uploaded during production builds; `:162`: hidden source maps, `.map` files deleted after the build.
- `index.mdx:139-154`: `instrument.mjs` with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`.
- `index.mdx:170,175-183`: `NODE_OPTIONS='--import ./instrument.mjs'` works for `nitro dev`, `nitro preview` and `node .output/server/index.mjs`.
- `index.mdx:203-214`: `routes/debug-sentry.ts` throws, `curl /debug-sentry` triggers the error.
- `index.mdx:228-249`: the tracing handler "starts a manual span".
- `index.mdx:273`: the Nitro `error` hook captures unhandled handler and middleware errors, `HTTPError`s with 3xx or 4xx status are skipped; `:275-282`: `enableNitroErrorHandler: false` disables the hook.
- `index.mdx:286-291`: "creates transactions for incoming requests", root spans `op: 'http.server'` named like `GET /users/:id`, middleware spans `op: 'middleware.nitro'`, `url.path.parameter.<key>` attributes, 3xx/4xx `HTTPError`s do not mark the span as errored.
- `index.mdx:295`: `sentry-trace` and `baggage` in `Server-Timing`, incoming headers honored, outgoing propagation via `@sentry/node`.
- `index.mdx:301-310`: manual spans inside handlers; `:314`: full `@sentry/node` API re-exported, all Node instrumentation works.

## Observed on 2026-09-09

### Step 1, Install

`npm install` with `nitro@3.0.260903-beta` (the registry's `latest`, what `npm install nitro` gives today)
**fails** with `ERESOLVE unable to resolve dependency tree ... peer nitro@">=3.0.0-0 <4.0.0 || 3.0.260311-beta
|| 3.0.260415-beta" from @sentry/nitro@10.67.0` (`npm-eresolve-nitro-latest.txt`). A prerelease only satisfies a
range comparator with the same `major.minor.patch`, so the peer range accepts exactly `3.0.0`,
`3.0.260311-beta` and `3.0.260415-beta` and rejects every beta published since (`260429`, `260522`, `260603`,
`260610`, `260903`). The guide's "`3.0.260415-beta` or newer" (`index.mdx:23`) does not hold for npm. With
`nitro@3.0.260415-beta` the install succeeded (`added 84 packages in 1m`); `node_modules/@sentry` holds
`bundler-plugins conventions core nitro node opentelemetry server-runtime-injection server-utils`, all `10.67.0`,
and `package-lock.json` has no registry-resolved `@sentry/*` entry except `@sentry/conventions@0.20.0`. The
`latest-nitro` variant used `npm install --legacy-peer-deps` (the workaround the error message suggests).

The `.env` file (`index.mdx:82-84`) was not created: with a token present, `nitro build` would contact
sentry.io. `SENTRY_AUTH_TOKEN` is unset in `run.sh`.

Exports the snippets use, checked in `node_modules/@sentry/nitro/build/types/{index,config,sdk}.d.ts`:

| Export | Status on develop |
| --- | --- |
| `withSentryConfig(config, sentryOptions?)` | exists (`config.d.ts`), options type `SentryNitroOptions = BuildTimeOptionsBase`; sets `tracingChannel: true`, pushes the Sentry module, configures source maps |
| `init(options?: NodeOptions)` | exists (`sdk.d.ts`); applies SDK metadata `sentry.javascript.nitro` |
| `enableNitroErrorHandler` (`index.mdx:280`) | **untyped**: not in `NodeOptions` (`@sentry/node`, `@sentry/core` or `@sentry/nitro` types); the hook reads it with an `in` check at runtime, so it works from `instrument.mjs` but a TypeScript init file gets an excess-property error |
| `Sentry.startSpan`, `Sentry.captureMessage`, `Sentry.logger` | exist, re-exported from `@sentry/node` (`index.d.ts:2`) |
| `defineHandler`, `HTTPError` from `nitro/h3`; `defineNitroConfig` from `nitro/config`; `nitro/vite` | exist in `nitro@3.0.260415-beta` (`exports`: `. ./app ./builder ./cache ./config ./context ./database ./h3 ./meta ./runtime-config ./storage ./task ./tsconfig ./types ./vite ./vite/runtime ./vite/types`) |
| `$fetch` | **not a global** in Nitro 3 (no `$fetch` in `nitro/dist/runtime`); `/outgoing` reports `{"used":"fetch"}` |

Nothing in the package is marked `@deprecated`.

### Step 2, Configure and build

`nitro.config.ts` is `index.mdx:86-99` plus `telemetry: false` (repro-only) and `serverDir: "./server"` (Step 3).
`npx nitro build` (preset `node-server`, builder rolldown) succeeded in both builds (`build.log`,
`build-latest-nitro.log`). Without an auth token the plugin prints `[@sentry/nitro] Warning: No auth token
provided. Will not create release.` and `... Will not upload source maps.`, the build lists
`.output/server/_libs/*.mjs.map` files, and after the build `find .output -name '*.map'` finds **none**: the
`.map` files are deleted even though nothing was uploaded, so a build without a token has no source maps at all
(`index.mdx:162` describes the deletion only for the upload case). Debug ids are injected into the output.

`instrument.mjs` is `index.mdx:139-154` verbatim plus `tunnel` and `debug: true`. Identity from the envelopes:
`sentry.javascript.nitro` `10.67.0`, runtime `node` `v26.5.0`. **46 integrations installed** with
`tracesSampleRate: 1.0` (the same set as `../koa/README.md`, no Nitro-specific integration):

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2 Redis Postgres Prisma
Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph Mastra VercelAI OpenAI Anthropic_AI
Google_GenAI PostgresJs Firebase SpanStreaming
```

With the "error-monitoring" option only (`errors-only`), **23 integrations**:

```
EventFilters FunctionToString LinkedErrors RequestData NodeSystemError ConversationId Console Http NodeFetch
OnUncaughtException OnUnhandledRejection ContextLines LocalVariablesAsync Context ChildProcess WorkerThreads
ProcessSession Modules Express Fastify Hapi Koa SpanStreaming
```

Debug lines at start-up: `Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing
Sentry: process: <pid>, thread: main.`, `SDK initialized from ESM`, `[Sentry] Runtime hook registered, injected
libraries=[]`, `[Sentry] Bundler plugin did not run`, and once per run `Sentry Logger [warn]: Discarded session
because of missing or non-string release` (`../node/README.md`). No deprecation output in any variant.

### Step 3, The verify route is not registered where the guide puts it (`results-root-routes.json`)

With the guide's config (`defineNitroConfig({ // your Nitro options... })`) and `routes/debug-sentry.ts` at the
project root, `nitro build` emits only `index.mjs` and the libs and **every route answers 404**, including
`/debug-sentry`; the sink gets 10 `span` envelopes named `GET` (`sentry.segment.name.source: url`) and no event.
Nitro 3 defaults to `serverDir: false` (`nitro/dist/_chunks/nitro.mjs:32`), which leaves `scanDirs` empty
(`:241-252`); Nitro's own docs set `serverDir: "./server"` (`nitro/dist/docs/0.docs/1.quick-start.md:55-59`: "The
`serverDir` option tells Nitro where to look for your server routes") and place routes in `server/routes/`. The
guide's `routes/debug-sentry.ts` file name is relative to a `serverDir` the guide never sets. All other variants
use `serverDir: "./server"` and `server/routes/`, `server/middleware/`.

### Step 4, Verify (variant `start`, `results-start.json`, `nitro@3.0.260415-beta`)

`/debug-sentry` answers HTTP 500. One error event:

```json
{"transaction":"GET /debug-sentry","level":"error",
 "exception_values":[
  {"type":"Error","value":"My first Sentry error!","mechanism":{"handled":true,"type":"chained","source":"cause","exception_id":1,"parent_id":0}},
  {"type":"HTTPError","value":"My first Sentry error!","mechanism":{"type":"auto.function.nitro.captureErrorHook","handled":false,"exception_id":0}}],
 "contexts_nitro":{"method":"GET","path":"/debug-sentry"},
 "request":{"url":"http://127.0.0.1:4736/debug-sentry","method":"GET","headers":["host","user-agent","accept"]}}
```

Nitro wraps the thrown `Error` in an `HTTPError` (status 500) with the original as `cause`; the `error` hook
captures the wrapper (`auto.function.nitro.captureErrorHook`, `handled: false`) and the original arrives as a
chained exception, so the outermost exception, which Sentry titles the issue by, is `HTTPError: My first Sentry
error!`. The event carries `transaction: GET /debug-sentry`, request url, method and headers (no body), user
`ip_address`, and a `nitro` context with method and path. `/error-404` (`HTTPError` 404) is **not** captured and
`/error-503` is captured as `HTTPError: custom 503` (`auto.function.nitro.captureErrorHook`), matching
`index.mdx:273`. No error was captured twice (`duplicate_error_events: []`). Nitro also prints each error to
stderr (`Error: My first Sentry error!` / `cause: ...`, `nitro_default_error_log: 4`).

Server spans, one `span` envelope per request (default `traceLifecycle: 'stream'`); **no `transaction` envelope
was sent in any variant**. Segments are named by the matched route with `sentry.segment.name.source: route`,
`http.route`, op `http.server`, and origin `auto.http.http_server` (the Node http integration's server span is
the segment, renamed with the route once h3 resolves it); the unmatched `/nope` probe is `GET` with source `url`:

```
GET                         [source=url   status=error 404]   (readiness probe /nope)
GET /api/users/:id          [source=route status=ok    200]
GET /debug-sentry           [source=route status=error 500]
GET /error-404              [source=route status=error 404]
GET /error-503              [source=route status=error 503]
GET /debug-log              [source=route status=ok    200]
GET /process-payment        [source=route status=ok    200]
GET /outgoing               [source=route status=ok    200]
GET /debug-sentry-tracing   [source=route status=error 500]
GET /sentinel               [source=route status=ok    200]
```

The `/api/users/42` segment carries `url.path.parameter.id: "42"`, `params.id: "42"`, `http.route:
/api/users/:id`, `server.port: 4736` (`index.mdx:290` holds). Its tree: segment `GET /api/users/:id`
(`auto.http.http_server`) -> child `http.server GET` (origin `auto.http.nitro.srvx`, a second `http.server` span
that keeps the bare `GET` name) -> two children `middleware GET /api/users/:id` (origin `auto.http.nitro.h3`,
**op `middleware`**, one for `audit.ts` and one for the handler, both named after the route, neither after the
middleware). There is no span with op `middleware.nitro` in any variant (`middleware_nitro_spans: []`), so the
op at `index.mdx:289` is wrong, and the `srvx.middleware` channel never fired for a `server/middleware/` file.
The `/error-404` segment has `status: error` with `http.response.status_code: 404`, as does the `/nope` probe, so
`index.mdx:291` ("3xx/4xx `HTTPError`s do not mark the span as errored") does not describe the segment; it is set
by the Node http instrumentation from the status code.

`/debug-sentry-tracing` (`index.mdx:233-249`): HTTP 500 after ~105 ms, the same chained `HTTPError` event with
`transaction: GET /debug-sentry-tracing`, plus a `test` span `My First Test Transaction` (`status: error`,
origin `manual`) as a child inside the `GET /debug-sentry-tracing` segment's `span` envelope. `/process-payment`
(`index.mdx:301-310`): a child span `process-payment` without op, HTTP 200. The guide's "creates transactions"
(`index.mdx:286`) and the span named "My First Test Transaction" do not match what arrives: only `span` items.

`Server-Timing` on `/api/users/42`: `sentry-trace;desc="<trace>-<span>-1", baggage;desc="sentry-environment=
production,...,sentry-transaction=GET%20%2Fapi%2Fusers%2F%3Aid,sentry-sampled=true,..."` (`index.mdx:295` holds).
`/outgoing` (`fetch`, `$fetch` is not defined): the sink's `/recorder` received `sentry-trace` and `baggage`,
and an `http.client GET 127.0.0.1` child span (origin `auto.http.node_fetch`) was sent. Log item: `info: User
example action completed`. Sentinel: `captureMessage` event, `mechanism: generic`, `transaction: GET /sentinel`.

### Step 5, Run variants

- **`preview`** (`npm run preview`, `index.mdx:179`): identical to `start` (4 events, 10 `span`, 1 `log`, 46
  integrations). `results-preview.json`.
- **`dev`** (`npm run dev -- --port 4736`, `index.mdx:178`): works, but the SDK initializes **twice** (`thread:
  main.` and `thread: worker-1.`, 92 `Integration installed` lines) and every request produces **two segments**:
  a main-thread dev-proxy segment named `GET` (`source: url`) and the worker's route-named one, 20 `span`
  envelopes for 10 requests; events, logs and headers are the same as `start`. `results-dev.json`.
- **`errors-only`** (no `tracesSampleRate`): 23 integrations, 0 `span` envelopes, the same 4 events with
  `auto.function.nitro.captureErrorHook` and `transaction: GET /debug-sentry`; `Server-Timing` and the outgoing
  `sentry-trace`/`baggage` headers are still emitted. `results-errors-only.json`.
- **`no-error-handler`** (`index.mdx:277-282` verbatim, `enableNitroErrorHandler: false`, no `tracesSampleRate`):
  only the sentinel event arrives; `/debug-sentry`, `/error-503` and the tracing route are captured by nothing
  (Nitro still logs them to stderr). `results-no-error-handler.json`.
- **`no-import`** (flag forgotten): the app runs, nothing reaches the sink, no warning is printed.
  `results-no-import.json`.
- **`latest-nitro`** (`nitro@3.0.260903-beta` via `--legacy-peer-deps`, srvx `1.0.4`): the app runs and all
  routes answer as before, but **7 events instead of 4**: `/debug-sentry` and `/debug-sentry-tracing` are each
  captured **twice** (`Error: My first Sentry error!` with `auto.http.nitro.onTraceError` from the h3 tracing
  channel, and the `HTTPError` wrapper with `auto.function.nitro.captureErrorHook`), and `/error-404` **is**
  reported (`HTTPError: custom 404`, `auto.http.nitro.onTraceError`), so `index.mdx:273` does not hold on the
  newer beta. Each request also gains a third nested `http.server GET /api/users/:id` span (origin
  `auto.http.nitro.h3`). Route names, parameters, `Server-Timing`, outgoing headers and logs are unchanged.
  `results-latest-nitro.json`.
- **`vite.config.ts` tab** (`index.mdx:101-122`): not run (needs `vite` from the registry; out of the time box).

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| Nitro `3.0.260415-beta` or newer (`index.mdx:23`) with `npm install @sentry/nitro` (`:50`) | **no** for npm: every beta newer than `3.0.260415-beta` fails with `ERESOLVE`; exactly `3.0.260415-beta` installs |
| `withSentryConfig` in `nitro.config.ts` (`index.mdx:86-99`) | **yes**, the module runs at build time and its plugin at runtime |
| Hidden source maps uploaded and `.map` files deleted (`index.mdx:75,162`) | **partial**: upload not tested (no token); `.map` files are deleted even without a token |
| `instrument.mjs` snippet initializes the SDK (`index.mdx:139-154`) | **yes** (`sentry.javascript.nitro` `10.67.0`) |
| `--import` works for `nitro dev`, `nitro preview`, `node .output/server/index.mjs` (`index.mdx:170,175-183`) | **yes**; `dev` initializes twice and doubles every request's segments |
| `routes/debug-sentry.ts` creates the issue (`index.mdx:203-214`) | **no** at the guide's path (`serverDir` unset, 404); **yes** under `server/routes/`, as `HTTPError: My first Sentry error!` with the thrown error chained |
| Tracing verify snippet "starts a manual span" (`index.mdx:228-249`) | **yes**, a `test` child span in a `span` envelope, no transaction |
| `error` hook captures handler errors, 3xx/4xx skipped (`index.mdx:273`) | **yes** on `3.0.260415-beta`; **no** on `3.0.260903-beta` (404 captured, every handler error captured twice) |
| `enableNitroErrorHandler: false` disables the hook (`index.mdx:275-282`) | **yes** (no `tracesSampleRate`); the option is untyped |
| "creates transactions for incoming requests" (`index.mdx:286`) | **no**, only `span` envelopes arrive under the default lifecycle |
| Root spans `op: http.server`, `GET /users/:id` style names (`index.mdx:288`) | **yes** |
| Middleware spans `op: 'middleware.nitro'` (`index.mdx:289`) | **no**, op is `middleware`, and the spans are named after the route, not the middleware |
| `url.path.parameter.<key>` attributes (`index.mdx:290`) | **yes** (`url.path.parameter.id`, plus `params.id`) |
| 3xx/4xx `HTTPError`s do not mark the span as errored (`index.mdx:291`) | **no** for the segment: `/error-404` has `status: error` |
| `sentry-trace`/`baggage` in `Server-Timing` (`index.mdx:295`) | **yes** |
| Outgoing propagation via `@sentry/node` (`index.mdx:295,314`) | **yes** with `fetch`; `$fetch` is not a global in Nitro 3 |
| Manual spans in handlers (`index.mdx:301-310`) | **yes** |
| Node.js 18.19.0+ (`index.mdx:24`) | **stale**: the package's `engines` is `>=20.19.0 <22.0.0 \|\| >=22.12.0 <23.0.0 \|\| >=23.2.0`; only Node v26.5.0 was run |

## Files

`package.json`, `nitro.config.ts`, `instrument.mjs`, `instrument-errors-only.mjs`, `instrument-no-error-handler.mjs`,
`server/routes/*.ts`, `server/routes/api/users/[id].ts`, `server/middleware/audit.ts`, `run.sh`, `summarize.mjs`,
`sink.mjs` (a copy of `../koa/sink.mjs`), `build.log`, `build-latest-nitro.log`, `npm-eresolve-nitro-latest.txt`,
`npm-install-latest.log`, `results-<variant>.json`, `app-<variant>.log`, `sink-<variant>.log`.
