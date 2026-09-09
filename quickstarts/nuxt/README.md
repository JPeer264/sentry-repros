# QS-nuxt, the Nuxt manual-setup path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. `@sentry/nuxt` pulls
`@sentry/browser`, `@sentry/cloudflare`, `@sentry/core`, `@sentry/node`, `@sentry/bundler-plugins`,
`@sentry/server-runtime-injection`, `@sentry/server-utils`, `@sentry/vue` and `@sentry/conventions@^0.20.0`
and declares peers `nuxt: >=3.7.0 || 4.x || 5.x` and `nitro: 2.x || 3.x` (optional).

Nuxt `4.5.2` (the registry `latest`; the prerequisites say "`3.7.0` or above", the SDK's own dependency is
`@nuxt/kit ^4.5.2`), `nitropack 2.13.4`, `h3 1.15.11`, `vue 3.5.42`, `vite 8.2.2`, all from the registry.
Server on node `v26.5.0`, client in Google Chrome `153.0.8010.37` driven by `playwright-core 1.55.0`
(`chromium.launch({ channel: 'chrome', headless: true })`, no browser download), macOS 15.7.7. Every envelope
goes to a local sink (`sink.mjs`, `localhost:4752`): the client through the `tunnel` option, the server through
its `dsn`. `SENTRY_AUTH_TOKEN` stays unset and `NUXT_TELEMETRY_DISABLED=1`; nothing leaves the machine except
the npm downloads. The Bun, Deno and Cloudflare runs of Nuxt live in the cells, this is Node only; the wizard
(`guides/nuxt/index.mdx`) is out of scope.

## What it reproduces

A new user following `docs/platforms/javascript/guides/nuxt/manual-setup.mdx` end to end: install, the
`@sentry/nuxt/module` in `nuxt.config.ts`, `sentry.client.config.ts` with every product option,
`sentry.server.config.ts`, the source maps section (read only), the verify page and the verify API route, then
the three install variants the page links. One Nuxt app (root-level `pages/` and `server/`, the layout the docs
show; Nuxt 4 falls back to it when there is no `app/` directory, and the build resolved every page):

| Route / file | What it does | Snippet |
| --- | --- | --- |
| `pages/example-error.vue` | `#errorBtn` throws `Nuxt Button Error`; "Throw Server Error" runs `Sentry.startSpan({ name: "Example Frontend Span", op: "test" }, async () => { await $fetch("/api/sentry-example") })` | `getting-started-complete/javascript.nuxt.mdx:464-489`, verbatim |
| `server/api/sentry-example.get.ts` | `defineEventHandler((event) => { throw new Error("Sentry Example API Route Error") })` | `javascript.nuxt.mdx:447-451`, verbatim |
| `pages/index.vue` | repro-only buttons: `$fetch("/api/echo")` (same-origin propagation), `fetch("http://localhost:4752/recorder")` (cross-origin), `$fetch("/api/error")` with a catch, the three `Sentry.logger.*` lines of `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-23` | repro-only |
| `pages/users/[id].vue` | prints `route.params.id`, reached by client-side navigation and by SSR | repro-only |
| `app.vue` | `NuxtLink`s `#nav-home`, `#nav-example`, `#nav-user` around `<NuxtPage />` | repro-only |
| `plugins/qs-expose.client.ts` | exposes `window.Sentry`, `window.__qsMeta()` (SDK metadata and installed integrations) and `window.__qsSentinel()` | repro-only |
| `server/api/error.get.ts` | throws `Server Route Error` | repro-only |
| `server/api/users/[id].get.ts` | returns `getRouterParam(event, "id")` | repro-only, parameterized route |
| `server/api/outgoing.get.ts` | `$fetch` (or `fetch` with `?via=fetch`) to the sink's `/recorder`, which stores `sentry-trace` and `baggage` | repro-only |
| `server/api/echo.get.ts` | returns the incoming `sentry-trace` and `baggage` headers | repro-only |
| `server/api/logs.get.ts` | the logs snippet on the server | `verify-logs-splitlayout.mdx:13-23` |
| `server/api/sentinel.get.ts` | `Sentry.captureMessage("sentinel-server")`; the run polls the sink for it instead of sleeping | repro-only |

`nuxt.config.ts` is `javascript.nuxt.mdx:74-76` plus `sentry.debug: true` (the alert at `cli-import.mdx:28`
and `guides/nuxt/index.mdx:53-57` says debug prints the built server config path), `autoInjectServerSentry`
read from `SENTRY_AUTO_INJECT` for the install variants, `telemetry: false` and a `compatibilityDate`.
`sentry.client.config.ts` is `:95-134` with all product options plus `tunnel` (the tunneling include,
`getting-started-tunneling/javascript.mdx:14-17`, pointed at the sink) and `debug: true`;
`sentry.server.config.ts` is `:182-195` plus `debug: true`. The `runtimeConfig` DSN variant (`:150-161`) and
the `dotenv` expandable (`:202-231`) were not run. The source maps snippets (`:331-341`, `:377-381`) were read
only; what the module prints without them is under "Observed".

## Which file each step renders from

`manual-setup.mdx` (`:1-9`) is two includes. `src/components/platformContent.tsx` resolves an include as
`javascript.nuxt`, then `javascript`, then `_default`:

| Reference | Renders from |
| --- | --- |
| `manual-setup.mdx:7` `sentry-init/manual-setup-callout` | `platform-includes/sentry-init/manual-setup-callout/javascript.nuxt.mdx:1-5` (an info alert pointing at the wizard) |
| `manual-setup.mdx:9` `getting-started-complete` | `platform-includes/getting-started-complete/javascript.nuxt.mdx:1-579`, the whole guide |
| `javascript.nuxt.mdx:1-4` prerequisites (`platform="javascript.nuxt"`) | `platform-includes/getting-started-prerequisites/javascript.nuxt.mdx:1-35`: "Nuxt version `3.7.0` or above (`3.14.0`+ recommended)", overrides for `< 3.14.0` |
| `javascript.nuxt.mdx:12-19` option buttons | inline: `error-monitoring`, `performance`, `session-replay`, `user-feedback` (no `logs`) |
| `javascript.nuxt.mdx:29` features expandable | `includes/quick-start-features-expandable.mdx:20` (Nuxt in the browser row) |
| `javascript.nuxt.mdx:45` install | inline: `npm install @sentry/nuxt --save` |
| `javascript.nuxt.mdx:73-77` module, `:94-135` client config, `:181-196` server config | inline |
| `javascript.nuxt.mdx:237-247` "server-side monitoring doesn't work in development mode ... `--import`" | inline, links `install/cli-import.mdx` |
| `javascript.nuxt.mdx:318-385` source maps | inline |
| `javascript.nuxt.mdx:390-393` tunneling (`platform="javascript"`) | `platform-includes/getting-started-tunneling/javascript.mdx:1-22` (`tunnel: "/tunnel"`) |
| `javascript.nuxt.mdx:398` data collection | `platform-includes/getting-started-data-collection/javascript.mdx` (only variant; not run) |
| `javascript.nuxt.mdx:412` sandbox warning | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` |
| `javascript.nuxt.mdx:417-429`, `:447-451`, `:464-489` verify | inline |
| `javascript.nuxt.mdx:499` logs verify (under `optionId="logs"`) | `includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:1-28`; unreachable, the buttons at `:12-19` do not offer `logs` |
| `javascript.nuxt.mdx:510-514` "build ... `--import`" | inline |
| `javascript.nuxt.mdx:534` locate data | `includes/quick-start-locate-data-expandable.mdx` (not run) |
| install variants | `install/index.mdx:7-12`, `install/cli-import.mdx:1-68`, `install/limited-server-tracing.mdx:1-38`, `install/dynamic-import.mdx:1-96`, all inline |

## Install

```bash
cd $REPRO/quickstarts/nuxt
npm install   # package.json pins the 14 @sentry/* tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides"
```

`added 609 packages in 2m`, no peer complaints. npm 11.17 printed an `allow-scripts` warning that
`esbuild@0.28.2`'s postinstall was not run; `npx esbuild --version` and the builds worked anyway.
`node_modules/@sentry` holds `browser browser-utils bundler-plugins cloudflare conventions core feedback node
nuxt opentelemetry replay replay-canvas server-runtime-injection server-utils vue`, all `10.67.0` from the
toolbox; the only registry-resolved `@sentry/*` entry in `package-lock.json` is `@sentry/conventions@0.20.0`.

Exports the snippets use, checked in `node_modules/@sentry/nuxt/build/types`:

| Export | Status on develop |
| --- | --- |
| `init` | `index.types.d.ts` (`export declare function init`), not deprecated |
| `replayIntegration`, `feedbackIntegration`, `startSpan`, `logger`, `captureMessage`, `getClient` | via `client/index.d.ts:1` `export * from '@sentry/vue'` and `server/index.d.ts:1` `export * from '@sentry/node'`; `startSpan` and `logger` are also declared in `index.types.d.ts`; no `@deprecated` in `index.types.d.ts`, `client/index.d.ts`, `server/index.d.ts` |
| module option `autoInjectServerSentry` (`limited-server-tracing.mdx:32`, `dynamic-import.mdx:60`) | **`@deprecated`**, `common/types.d.ts:55-64`: "bundled into the Nitro server build by default now ... no `node --import` preload and no inject mode needed ... will be removed in a future major version" |
| module option `experimental_entrypointWrappedFunctions` (`dynamic-import.mdx:93`) | **`@deprecated`**, `common/types.d.ts:88-91` |
| module options `debug`, `org`, `project`, `authToken` | exist |
| `sentryCloudflareNitroPlugin` from `@sentry/nuxt/module/plugins` (`:281`) | exists, `build/module/runtime/plugins/index.d.ts:1` (Cloudflare not run here) |
| `defineEventHandler`, `getRouterParam`, `useRuntimeConfig`, `$fetch` | Nuxt/Nitro auto-imports; `$fetch` is a global in the Nitro 2 server runtime (`/api/outgoing` returned `{"via":"$fetch","body":{"ok":true}}`) |

## Run

```bash
cd $REPRO/quickstarts/nuxt
./run.sh build default            # nuxt build, no autoInjectServerSentry                         -> build-default.log
./run.sh plain                    # node .output/server/index.mjs                                  -> results-plain.json
./run.sh import-flag              # node --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs (cli-import.mdx:37) -> results-import-flag.json
./run.sh build top-level-import   # autoInjectServerSentry: "top-level-import" (limited-server-tracing.mdx:29-35)
./run.sh top-level-import         # node .output/server/index.mjs                                  -> results-top-level-import.json
./run.sh build dynamic-import     # autoInjectServerSentry: "experimental_dynamic-import" (dynamic-import.mdx:57-63)
./run.sh dynamic-import           # node .output/server/index.mjs                                  -> results-dynamic-import.json
```

Each run checks that `4752` and `4753` are free, starts the sink and the server (`PORT=4753`,
`NUXT_TELEMETRY_DISABLED=1`), then `drive.mjs` calls the server routes from Node (`/api/users/42`,
`/api/sentry-example`, `/api/error`, `/api/echo` with and without an incoming `sentry-trace`, `/api/outgoing`
twice, `/api/logs`, `/api/nope`, SSR of `/users/42` and `/example-error`), opens one headless Chrome at `/`,
clicks the repro buttons, navigates to `/example-error`, clicks both docs buttons, navigates to `/users/42` and
back, fires the client sentinel (`captureMessage("sentinel")` plus a `sentinel-span`) and the server sentinel
(`/api/sentinel`), polls the sink for all four (hard deadline 60 s), waits for the pageload segment and one
replay envelope, and writes `results-<variant>.json` (versions, steps, verdict, summary, the full server and
browser console, the build log, compact sink items, recorder headers, raw envelopes). Machine paths are replaced
by `$REPRO`. `app-<variant>.log` is the server console, `sink-<variant>.log` the sink's.

## Expected (what the pages claim)

- `prerequisites/javascript.nuxt.mdx:7`: Nuxt `3.7.0` or above.
- `javascript.nuxt.mdx:45`: `npm install @sentry/nuxt --save`; `:74-76`: `modules: ["@sentry/nuxt/module"]`.
- `:89`: `sentry.client.config.ts` in the project root initializes the client; `:118-119`, `:188-189`: "Set tracesSampleRate to 1.0 to capture 100% of transactions".
- `:174`: `sentry.server.config.ts` in the project root initializes the server.
- `:237`: "Sentry's server-side monitoring doesn't work in development mode. To enable it, you first need to build your application and then load the Sentry server-side config using the `--import` flag"; `:244-247` and `cli-import.mdx:37`: `node --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs`; `:510-514`: "make sure to load Sentry on the server side by explicitly adding the Sentry server config in the build output via `--import`".
- `cli-import.mdx:7-11`: `--import` is "the default way", "crucial for ensuring proper server-side initialization", registers the loader hook; `:25`: "By default, the SDK will add the Sentry server config to the build output (typically, `.output/server/sentry.server.config.mjs`)"; `:28`: `debug` prints its exact path; `:49`, `:62`, `:67`: `start` script, direct flag, `NODE_OPTIONS`.
- `install/index.mdx:7-10`: Sentry has to register Node customization hooks before the rest of the application, hence the two install approaches.
- `limited-server-tracing.mdx:27-38`: `autoInjectServerSentry: "top-level-import"` adds the config to the build output and imports it at the top of the entry; `:18-19`: only native Node APIs get instrumented then.
- `dynamic-import.mdx:9-13`: "This installation method doesn't work with more recent versions of Nuxt/Nitro"; `:55-77`: `autoInjectServerSentry: 'experimental_dynamic-import'` wraps the entry with `import()`.
- `:326`: the `sentry` options only affect build time; `:370`: Nuxt generates server source maps by default, client ones must be enabled; `:372`: `hidden` suppresses the reference comments.
- `:410`, `:417-429`: the button click creates an issue; `:442-451`, `:459-489`: the second button fetches the throwing API route and the client span is `Example Frontend Span`; `:518`: open the page and click the buttons.
- `tunneling/javascript.mdx:5`: `tunnel` sends all events to the endpoint.

## Observed on 2026-09-09

### Step 1, Install and build

`npm install` as above. `./run.sh build default` (`build-default.log`) succeeded. Module output with
`sentry.debug: true`: `[Sentry] [Nitro Database Plugin]: No database configuration found. Skipping database
instrumentation.`, `[Sentry] Setting sentry.sourcemaps.filesToDeleteAfterUpload: [...]`, ` WARN  [Sentry] Source
map generation is currently disabled in your Vite configuration (sourcemap.client: false ) ... enable source maps
in sourcemap.client (e.g. by setting them to hidden)`, `[Sentry] sourcemap.server is enabled with true`,
`[Sentry] Set sourcemapExcludeSources: false in the Nuxt config`, `[Sentry] Adding Sentry Rollup plugin to the
server runtime.`, **`[Sentry] Bundled $REPRO/quickstarts/nuxt/sentry.server.config.ts into the Nitro server
build. The SDK initializes itself at server startup — no node --import preload needed.`**, then, per bundle
(vite client, vite server, rollup server), `[sentry-vite-plugin] Info: Sending telemetry data on issues and
performance to Sentry. To disable telemetry, set options.telemetry to false.` and twice `Warning: No auth token
provided. Will not create release / Will not upload source maps`. Nuxt's own ` WARN  [plugin
builtin:vite-reporter]` chunk-size warning is unrelated. `.output/server` holds `.map` files next to every
chunk (server source maps on by default, as `:370` says) and the client bundle has none.

`.output/server/index.mjs` imports `@sentry/core`, `@sentry/node`, `@sentry/core/server`,
`@sentry/server-utils` directly; the server config is compiled into `chunks/nitro/nitro.mjs`.
`.output/server/sentry.server.config.mjs` still exists but is a four-line shim:
`// This file only keeps existing node --import ./.output/server/sentry.server.config.mjs commands working.`
`console.warn('[Sentry] The --import flag for the Sentry server config is no longer needed and should be removed.');`
The debug line prints the source path of `sentry.server.config.ts`, not a built config path, because there is
none to preload.

`./run.sh build top-level-import` prints ` WARN  [Sentry] autoInjectServerSentry: 'top-level-import' is
deprecated and will be removed in a future major version. The Sentry server config is bundled into the Nitro
server build by default now. Remove the option to use the default behavior.`; the entry then starts with
`import './sentry.server.config.mjs';` and that file is the real compiled config (4.42 kB, `init({ dsn, debug,
tracesSampleRate: 1 })`). `./run.sh build dynamic-import` prints the same deprecation warning for
`'experimental_dynamic-import'` plus `[Sentry] Wrapping the server entry file with a dynamic import(), so
Sentry can be preloaded before the server initializes.`; the entry inlines `init` from `@sentry/node` and the
Nuxt wrapper. All three builds exit 0.

### Step 2, the four server start variants

All four are `works` (`results-*.json`, `verdict.status`): the same client and server telemetry arrived in each.

| Variant | Command | Server console start | Server events / span envelopes |
| --- | --- | --- | --- |
| `plain` | `node .output/server/index.mjs` | `Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()`, `Initializing Sentry: process: ..., thread: main.`, 46 `Integration installed` lines, `Listening on http://[::]:4753` | 7 / 16 |
| `import-flag` | `node --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs` (`cli-import.mdx:37`) | **`[Sentry] The --import flag for the Sentry server config is no longer needed and should be removed.`**, then the same lines | 7 / 15 |
| `top-level-import` | `node .output/server/index.mjs` after `build top-level-import` | same as `plain`, plus `[Sentry] Bundler plugin ran, injected libraries=[]` instead of `Bundler plugin did not run` | 7 / 15 |
| `dynamic-import` | `node .output/server/index.mjs` after `build dynamic-import` | same as `top-level-import` | 7 / 15 |

The customization hooks the install pages say need `--import` (`install/index.mdx:7-8`, `cli-import.mdx:11`) are
registered by the bundled config itself: `Registered diagnostics-channel injection via Module.registerHooks()`
is the first server log line in every variant, including `plain`. No `Sentry Logger [warn]` line appeared on
either side in any variant. The debug-only `[Sentry] Runtime hook registered, injected libraries=[]` and
`[Sentry] Bundler plugin did not run` (default build) / `ran` (inject modes) lines are the
server-runtime-injection status; this app has no library to inject, so nothing observable differs.

### Step 3, what arrives (identical across variants, numbers from `results-plain.json`)

Server side (`sdk.name: sentry.javascript.nuxt`, `10.67.0`, 46 integrations: `EventFilters, FunctionToString,
LinkedErrors, RequestData, NodeSystemError, ConversationId, Console, Http, NodeFetch, OnUncaughtException,
OnUnhandledRejection, ContextLines, LocalVariablesAsync, Context, ChildProcess, WorkerThreads, ProcessSession,
Modules, Express, Fastify, Hapi, Koa, Graphql, Mongo, Mongoose, Mysql, Mysql2, Redis, Postgres, Prisma, Tedious,
GenericPool, Kafka, Amqplib, LruMemoizer, Aws, LangChain, LangGraph, Mastra, VercelAI, OpenAI, Anthropic_AI,
Google_GenAI, PostgresJs, Firebase, SpanStreaming`):

- `event` x7: `Error: Sentry Example API Route Error` three times, `transaction: GET /api/sentry-example`,
  `request.url http://localhost:4753/api/sentry-example` (one Node call, two from the docs button: ofetch retries
  a GET once on a 500); `Error: Server Route Error` three times (`GET /api/error`, same retry); the sentinel
  message. The primary exception (`exception_id: 0`) has `mechanism.type: auto.function.nuxt.nitro`,
  `handled: false`, and a second `chained` entry (`source: cause`) with the same type and message, because Nitro
  wraps the thrown error in an `H3Error` whose `cause` is the original. Contexts `trace, nuxt, runtime, app, os,
  device, culture, cloud_resource`. Nitro also prints `[request error] [unhandled] [GET] ... H3Error: ...` itself.
- `span` x16 envelopes, no `transaction` item anywhere (`summary.transaction_items: 0`). Segments are
  `op: http.server`, `origin: auto.http.http_server`: `GET /api/users/:id` (`sentry.segment.name.source: route`,
  `http.route: /api/users/:id`, `url.path.parameter.id: "42"`, `params.id: "42"`), `GET /users/:id()` for the SSR
  of the parameterized page (`route`), `GET /api/outgoing` for the request that carried a query string, and
  **`GET`** with `source: url` and only a `url.path` attribute for every other request (`/`, `/example-error`,
  `/api/sentry-example`, `/api/error`, `/api/echo`, `/api/logs`, `/api/nope` (404, `status: error`),
  `/_nuxt/builds/meta/...json`). `hooks/updateRouteBeforeResponse.js:14` sets `http.route` only when
  `matchedRoute.path !== event.path`, so static routes never get a route name and the low-cardinality span
  name is the bare method; the events' `transaction` still says `GET /api/sentry-example`. The only child span
  is `http.client GET localhost` (`origin: auto.http.node_fetch`) for the outgoing requests.
- `log` x1 batch: `info: User example action completed`, `warn: Slow operation detected`, `error: Validation
  failed` from `/api/logs`, with no `enableLogs` option anywhere.
- `session` x1 (`ProcessSession`).
- Outgoing propagation: both `$fetch` and `fetch` to the sink's `/recorder` carried `sentry-trace` and
  `baggage` (`sentry-environment=production, sentry-release=<debug-id release>, sentry-public_key=public,
  sentry-trace_id=..., sentry-sampled=true, sentry-sample_rand=..., sentry-sample_rate=1`). An incoming
  `sentry-trace` on `/api/echo` is continued (the segment joins that trace). No `Server-Timing` header on any
  response (the page does not claim one).

Client side (`sdk.name: sentry.javascript.nuxt`, `10.67.0`, `packages: npm:@sentry/nuxt, npm:@sentry/vue`,
17 integrations: `EventFilters, FunctionToString, ConversationId, BrowserApiErrors, Breadcrumbs, GlobalHandlers,
LinkedErrors, Dedupe, HttpContext, CultureContext, BrowserSession, Replay, Feedback, BrowserTracing,
SpanStreaming, WebVitals, Vue`), everything through the `tunnel`:

- `event` x4: `Error: Nuxt Button Error` (`mechanism.type: auto.function.nuxt.vue-error`, `handled: false`,
  `transaction: /example-error`, `tags.replayId` set); `FetchError: [GET] "/api/sentry-example": 500 Server
  Error` (`auto.browser.global_handlers.onunhandledrejection`, `handled: false`) because the docs'
  `getSentryData` awaits `$fetch` without a catch, and the same rejection is a `pageerror` in the console; the
  sentinel; the replay trigger.
- `span` x4 envelopes: segments `pageload /` (`source: route`, `origin: auto.pageload.vue`) and `navigation
  /example-error`, `navigation /users/:id()`, `navigation /` (`route`, `auto.navigation.vue`); children include
  `ui.mount Vue <Root>`, `ui.render Application Render`, `http.client GET localhost`, the `test Example Frontend
  Span` from the docs button (parent: the `/example-error` navigation), web vitals and resource spans. The
  same-origin `$fetch("/api/echo")` carried `sentry-trace` and `baggage` (the server echoed them) and the two
  `/api/sentry-example` server segments from the button sit in the browser's trace
  (`summary.trace_continuation.same_trace: true`). The cross-origin `fetch` to the sink carried no headers
  (default same-origin `tracePropagationTargets`).
- `log` x1 batch with the three logger lines, without `enableLogs`; `session` x2; `replay_event` +
  `replay_recording` after the error (`replaysOnErrorSampleRate: 1.0`), the feedback widget rendered
  (`client_feedback_widget: true`).
- Browser console: only `Sentry Logger [log]` lines and Chrome's `Failed to load resource: ... 500` for the
  docs button; no warnings.

## Findings

1. **P1, docs wrong.** `javascript.nuxt.mdx:237-247` and `:510-514` (also `guides/nuxt/index.mdx:53-57,
   65-72, 87-94` on the wizard page) tell the user to start the built app with `node --import
   ./.output/server/sentry.server.config.mjs .output/server/index.mjs` so the server SDK loads. On develop the
   server config is bundled into the Nitro build (build log: `[Sentry] Bundled ... into the Nitro server build.
   The SDK initializes itself at server startup — no node --import preload needed.`); plain `node
   .output/server/index.mjs` produced the full server telemetry (`results-plain.json`: 46 integrations, 7
   events, 16 span envelopes, `GET /api/users/:id`), and the file the docs preload is a shim whose only effect
   is `[Sentry] The --import flag for the Sentry server config is no longer needed and should be removed.`
   (`results-import-flag.json`, first server line). The dev-mode half of `:237` was not run.
2. **P1, docs wrong.** `install/cli-import.mdx:1-68` (titled "`--import` CLI flag (default)") and
   `install/index.mdx:7-12` present `--import` as the default and necessary install method ("crucial", "By
   default, the SDK will add the Sentry server config to the build output", the `start` script at `:49`,
   `NODE_OPTIONS` at `:67`). Observed: the customization hooks are registered by the bundled config
   (`Registered diagnostics-channel injection via Module.registerHooks()` is the first log line without the
   flag), the built `sentry.server.config.mjs` is the warning shim, and `debug` (`:28`) prints the source
   path plus the "no --import needed" note rather than a file to preload.
3. **P2, docs wrong.** `install/limited-server-tracing.mdx:27-38` and `install/dynamic-import.mdx:55-77,
   86-95` document `autoInjectServerSentry` and `experimental_entrypointWrappedFunctions` as current options.
   Both are `@deprecated` in `build/types/common/types.d.ts:55-64, 88-91` and every build with them prints
   ` WARN  [Sentry] autoInjectServerSentry: '...' is deprecated and will be removed in a future major
   version ... Remove the option to use the default behavior.` Both modes still work
   (`results-top-level-import.json`, `results-dynamic-import.json`: `works`). `dynamic-import.mdx:9-13`
   additionally says the method "doesn't work with more recent versions of Nuxt/Nitro"; it worked on Nuxt
   4.5.2 / nitropack 2.13.4.
4. **P2, docs wrong.** `prerequisites/javascript.nuxt.mdx:7` names "Nuxt version `3.7.0` or above (`3.14.0`+
   recommended)". The package's peer range is `nuxt: >=3.7.0 || 4.x || 5.x`, it depends on `@nuxt/kit
   ^4.5.2`, and the registry `latest` a new user installs is `4.5.2`, which this run used.
5. **P2, docs wrong.** `javascript.nuxt.mdx:118-119` and `:188-189` describe `tracesSampleRate` as capturing
   "100% of transactions". Both sides sent every span as `span` envelope items with `is_segment` segments
   (`summary.transaction_items: 0`); no `transaction` item was produced.
6. **P2, docs wrong.** `javascript.nuxt.mdx:12-19` offers `error-monitoring`, `performance`, `session-replay`
   and `user-feedback`, so the logs verify block at `:497-501` never renders and neither init snippet mentions
   logs; the three `Sentry.logger.*` lines produced a `log` envelope on each side with no option at all.
7. **P2, docs wrong.** `javascript.nuxt.mdx:459-489`: the "Throw Server Error" button also creates a
   client-side issue `FetchError: [GET] "/api/sentry-example": 500 Server Error` (unhandled rejection of the
   uncaught `$fetch`) and, because ofetch retries a GET once on a 500, two server events per click; the page
   describes one server error.
8. **P2, SDK limit.** Server `http.server` segments for static routes are named `GET` (`source: url`, the
   path only in `url.path`); only parameterized routes (`GET /api/users/:id`, `GET /users/:id()`) or requests
   with a query string (`GET /api/outgoing`) get a route name, since `updateRouteBeforeResponse` sets
   `http.route` only when `matchedRoute.path !== event.path`. The events keep `transaction: GET
   /api/sentry-example`. The manual-setup page makes no span-name claim.

## Notes

- Nuxt 4 accepted the docs' root-level `pages/` and `server/` layout (no `app/` directory, so `srcDir` fell
  back to the root); `pages/example-error.vue` and `server/api/sentry-example.get.ts` exist verbatim.
- The source maps section (`:318-385`) was read only: without `org`/`project`/`authToken` the bundler plugin
  warns three times that it will not create a release or upload source maps, and prints that it sends
  telemetry unless `options.telemetry` is `false`; the warning about `sourcemap.client: false` matches `:370`.
- The `tunnel` option was pointed at the sink's origin, not a same-origin `/tunnel` route; the cross-origin
  POST works because the sink answers with `access-control-allow-origin: *`.
- `drive.mjs` calls `/api/sentry-example` once from Node before the browser clicks, and the sink labels each
  item with the sending side from the `User-Agent`; `results-plain.json` was produced by a second `plain` run
  after the driver's trace-continuation check was fixed to look at every server segment in the browser's trace.
- Nothing runs after `./run.sh`: it kills the server and the sink on exit and checks both ports before starting.
