import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..'))
import json, os, re, html as H
OUT=os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)
REPORT='https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html'
AUDIT='https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html'
REPRO='https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements'
def cells(*ids):
    recs=', '.join(ids)
    paths=', '.join('[`cells/%s/`](%s/cells/%s)' % (i, REPRO, i) for i in ids)
    return '**Evidence.** Cell record%s %s in the [deep probe report](%s); reproduction%s %s, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).' % ('s' if len(ids)>1 else '', recs, REPORT, 's' if len(ids)>1 else '', paths)
def probes(*ids):
    have=[i for i in ids if os.path.isdir(os.path.join(ROOT,'probes',i))]
    first=[i for i in ids if i not in have]
    out='**Evidence.** '
    if have:
        out+='Probe record%s %s in the [deep probe report](%s); reproduction%s %s. ' % ('s' if len(have)>1 else '', ', '.join(have), REPORT, 's' if len(have)>1 else '', ', '.join('[`probes/%s/`](%s/probes/%s)' % (i, REPRO, i) for i in have))
    if first:
        out+='First-round probe%s %s, see the code-defects table in the [docs audit](%s). ' % ('s' if len(first)>1 else '', ', '.join(first), AUDIT)
    return out+'Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).'

T=[]
def t(ms, title, labels, prio, body): T.append(dict(milestone=ms, title=title, labels=labels, priority=prio, body=body.strip()))

BUN='Bun + Framework gaps'; DENO='Deno + Framework gaps'; CF='Cloudflare + Framework gaps'
BUNG='Bun Functionality Gaps'; DENOG='Deno Functionality Gaps'; CFG='CF Functionality Gaps'; XP='XPlatform Functionality Gaps'
BUNT='Bun Test Coverage'; DENOT='Deno Test Coverage'; CFT='CF Test Coverage'; DOCS='Documentation Correctness'

t(BUN, 'Framework SDKs on Bun record no request or fetch spans unless the Bun integrations are added by hand', ['JavaScript','Bun','Bug'], 'High', '''
`@sentry/nextjs`, `@sentry/nuxt`, `@sentry/sveltekit`, `@sentry/astro`, `@sentry/react-router`, `@sentry/tanstackstart-react`, `@sentry/solidstart` and `@sentry/remix` initialize the Node SDK. On Bun 1.4.0, Bun never publishes `http.server.request.start` and Node's undici fetch channels never fire. Outgoing fetch spans are missing in every cell. The server span, and with it route names, per-request isolation and incoming trace continuation, is missing wherever the framework leans on the `node:http` instrumentation: Nuxt, React Router, Remix and TanStack Start. Next.js, SvelteKit and Astro keep route names, isolation and incoming trace through their own instrumentation and only lose outgoing fetch. Errors and logs arrive everywhere, so nothing looks broken.

Verified fix: install `@sentry/bun` next to the framework SDK, add `fetchIntegration()` to the server init, and add `bunServerIntegration()` or `bunHttpServerIntegration()` (whichever server the framework uses) where the server span is missing, gated on `typeof Bun !== "undefined"`. React Router needs its own `instrumentations` export on top; Nuxt needs `bunServerIntegration()` on the `bun` preset and `bunHttpServerIntegration()` on `node-server`. The repo's own e2e app `nextjs-16-bun` passes `bunHttpServerIntegration({ spans: false })` in `sentry.server.config.ts`; that shape was not exercised here, and Next.js isolation was recorded working without it. Database spans are a separate defect, the Bun channel GC bug.

**Work item.** Detect Bun in the framework server inits and add the integrations there, so the documented wiring works unchanged. Until then, one shared docs snippet (DOC-B3 in the audit).

''' + cells('M-nextjs-bun','M-nuxt-bun','M-sveltekit-bun','M-astro-bun','M-reactrouter-bun','M-tanstack-bun','M-solidstart-bun','M-remix-bun'))

t(BUN, 'Hono on Bun: a `Bun.build` that externalizes `@sentry/*` while inlining `hono` 500s every request', ['JavaScript','Bun','Bug'], 'Medium', '''
`bun app.ts` with `@sentry/hono/bun` gives `GET /users/:id` (source `route`) and the `auto.http.hono.context_error` event, with no instrument file and no `--preload`, because the middleware calls `Sentry.init` itself. A `Bun.build` with `sentryBunPlugin()` and `external: ["@sentry/*"]` keeps `@sentry/hono` external but inlines `hono`, which leaves two copies of hono's `GET_MATCH_RESULT` symbol in the process: every request then 500s inside `@sentry/hono`'s `requestHandler`. The working choices are no `external` at all, which is the verified recipe, or `hono` externalized together with `@sentry/*`, which behaves exactly like the unbundled run.

The bundle is what adds spans for drivers that publish no diagnostics channels of their own, such as `mysql@2`; `mysql2` 3.20.0+ needs no build step, as long as the driver is queried early or the channels are pinned.

**Work item.** Make `@sentry/hono` survive a second copy of `hono` in the bundle, or detect the duplicate at init and fail with the fix, which is to drop `external` or to externalize `hono` too.

''' + cells('M-hono-bun'))

t(BUN, 'NestJS on Bun: the documented `@sentry/nestjs` init emits no server span, and the plugin build fails without Nest peers as externals', ['JavaScript','Bun','Bug'], 'Medium', '''
NestJS 11 boots on Bun 1.4.0 with a `tsconfig.json` that has `experimentalDecorators` and `emitDecoratorMetadata`. Initializing from `@sentry/nestjs` costs the server span entirely: unbundled, no server span of any kind is emitted and events lose their transaction name. The verified shape is `Sentry.init` from `@sentry/bun` in `src/instrument.ts`, imported as the first line of `src/main.ts`, plus `SentryModule.forRoot()` and the `SentryGlobalFilter` `APP_FILTER` provider from `@sentry/nestjs/setup`, which is the piece that captures controller errors. Route names and the Express middleware and handler spans exist only in the bundled build: `bun src/main.ts` gives URL-sourced names under `traceLifecycle: 'static'` and a span named just `http.server GET`, with no path at all, under the stream default. No runtime hook substitutes for the bundle, `Bun.plugin(sentryBunPlugin())` at runtime breaks `@nestjs/common`'s CommonJS named exports and `@sentry/server-runtime-injection/register` is a no-op on Bun.

The `Bun.build` with `sentryBunPlugin()` fails with `Could not resolve: "@nestjs/microservices/microservices-module"` unless Nest's lazily required optional peers are listed as `external` (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`). `@sentry/bun` and the driver may stay on that list, because the plugin un-externalizes the packages it instruments.

**Work item.** Make `@sentry/nestjs` init pick the Bun SDK on Bun, and have the plugin treat Nest's optional peers as external by default.

''' + cells('M-nestjs-bun'))

t(BUN, 'Remix on Bun: the request handler patch never runs when the server runtime is inlined', ['JavaScript','Bun','Bug'], 'Medium', '''
Plain `bun server.mjs` sends errors and logs only: no transactions, no spans, and no `transaction` field on the events, so errors group without a route. Per-request isolation and incoming trace continuation do work there. Bundling the server entry with `Bun.build({ plugins: [sentryBunPlugin()] })` and running `bun dist/server.js` gives route-named transactions (`GET users/:id`, source `route`, with no leading slash), `function LOADER routes/users.$id` children and `mysql2` database spans; outgoing fetch spans did not reproduce on the re-run, where `sentry-trace` and `baggage` came back null on every attempt. Because the bundle inlines `@remix-run/server-runtime`, Sentry's `createRequestHandler` patch never runs, so per-request isolation and incoming trace continuation come back only when the app wraps the adapter handler itself, an `app.all('*', ...)` around it with `withIsolationScope`, `continueTrace` and `setSDKProcessingMetadata({ normalizedRequest })`, the last of which is also what puts request data on the events.

The split has one root cause in the SDK: the `loadModule` monkeypatch and `withoutInstrumentedExternals` give spans or isolation, never both. `express` must go back on `external` after the plugin has run, through a keep-external plugin appended after `sentryBunPlugin()`, because the plugin un-externalizes the packages it instruments. A second app-side trap, `"sideEffects": false` in the app's `package.json` letting `Bun.build` tree-shake the side-effect-only driver import, comes from a follow-up run whose result was never recorded.

**Work item.** Apply the request handler patch to an inlined server runtime (the plugin can transform it), so one build shape gives both spans and isolation.

''' + cells('M-remix-bun'))

t(BUN, 'React Router on Bun: the documented server entry depends on `renderToPipeableStream`, which Bun does not provide', ['JavaScript','Bun','Bug'], 'Medium', '''
Bun resolves `react-dom/server` to a build without `renderToPipeableStream`, so `createSentryHandleRequest({ renderToPipeableStream, ... })` from the guide cannot be used. The verified entry uses `renderToReadableStream` with `Sentry.wrapSentryHandleRequest(handler)` and `export const handleError = Sentry.createSentryHandleError({ logErrors: true })`. The customization escape hatch at `manual-setup.mdx:284-330` (`getMetaTagTransformer` plus `wrapSentryHandleRequest`) builds on `renderToPipeableStream` too and needs the same variant.

Two further things are required on Bun that the guide calls optional or never mentions. `export const instrumentations = [Sentry.createSentryServerInstrumentation()];` is what produces a route-named `http.server` span at all, while `manual-setup.mdx:273` presents it as optional, which holds only for Node. `bunHttpServerIntegration()` from `@sentry/bun` on top of it restores per-request isolation, incoming trace continuation, outgoing fetch spans and database spans; without both, only errors and logs arrive. Gate the integrations on the runtime (`process.versions.bun ? [fetchIntegration(), bunHttpServerIntegration()] : []`), or Node gets two client spans per `fetch`.

**Work item.** Ship a `renderToReadableStream` variant of `createSentryHandleRequest` and of the `getMetaTagTransformer` escape hatch, or name `wrapSentryHandleRequest` as the Bun path in the package docs. Make the `instrumentations` export unnecessary on Bun, or state that it is required there.

''' + cells('M-reactrouter-bun'))

t(BUN, 'TanStack Start on Bun: isolation leaks between requests, incoming traces are ignored, and route names are never produced', ['JavaScript','Bun','Bug'], 'Medium', '''
The documented wiring builds and runs on Bun as it stands: `sentryTanstackStart()` from `@sentry/tanstackstart-react/vite` last in the Vite plugin list, `sentryGlobalRequestMiddleware` and `sentryGlobalFunctionMiddleware` in `createStart()`, `wrapFetchWithSentry` on the server entry, started with `bun --preload ./.output/server/instrument.server.mjs .output/server/index.mjs`. Errors from `server.handlers` routes and logs arrive. Four capabilities do not. Per-request isolation is recorded broken: three concurrent requests and a sentinel all carried the tags of the last request and one shared trace id, which is a process-global isolation scope leaking tags, and user data with them. Incoming `sentry-trace` and `baggage` are ignored. Outgoing fetch spans are absent. Parameterized names such as `GET /api/user/$id` were never produced. Follow-up runs that added `bunHttpServerIntegration()` were never recorded, so none of the four is claimed fixed.

Database spans need the diagnostics-channel pin from the Bun channel ticket, over `orchestrion:mysql:query`, `orchestrion:mysql2:query` and `orchestrion:mysql2:execute`: the same build gave `["middleware globalRequestMiddleware"]` without it and the two `db` spans with it. Use the stream lifecycle here, under `static` each database span arrives as its own transaction.

**Work item.** Find why the process-global isolation scope leaks between requests on Bun and why the route patterns the Vite plugin inlines never reach the server span, and put a recorded run of the four capabilities with `bunHttpServerIntegration()` on the record.

''' + cells('M-tanstack-bun'))

t(BUN, 'Nuxt `bun` preset: no request span unless `bunServerIntegration()` is added by hand', ['JavaScript','Bun','Improvement'], 'Medium', '''
The server init no longer needs a start-up flag or an inject mode: since develop commit `ec50b3e8f1` the Nitro build bundles `sentry.server.config.ts` and imports it from a generated Nitro plugin, so `Sentry.init` runs at server startup under `NITRO_PRESET=bun npx nuxt build` and `bun run .output/server/index.mjs`. Both `autoInjectServerSentry` modes are deprecated as of that commit and keep working until v12, and the config is no longer emitted to `.output/server/sentry.server.config.mjs`.

What Bun still needs is the server instrumentation. Without `bunServerIntegration()` from `@sentry/bun` there is no request span at all: every event in the process shares one trace id, a stale transaction name leaks from an earlier request onto every later event, names are not route-based, incoming trace headers are ignored, and the `mysql2` span is dropped too, because its subscriber binds with `requiresParentSpan: true` and has no request span to attach to. The cause is the runtime rather than the preset, Bun never publishes `http.server.request.start` (0 events on Bun against 1 on Node), and the default `node-server` preset under Bun needs `bunHttpServerIntegration()` for the same reason. Nitro bundling `mysql2` is a separate problem: without `nitro.externals.external: ["mysql2"]` the query itself fails with `genFunc$1 is not a function`, with or without Sentry, and with the entry but no `bunServerIntegration()` the query succeeds and no span is recorded.

**Work item.** Add the Bun server integration from the `@sentry/nuxt` server side when the runtime is Bun, so the documented wiring produces a request span on both presets.

''' + cells('M-nuxt-bun'))

t(DENO, 'Express, Hapi, Koa and NestJS on Deno: hook order and JSON-require failures per framework', ['JavaScript','Deno','Bug'], 'High', '''
With `import "@sentry/deno/import"` as the first line, all four abort at import with `SyntaxError: Unexpected token ':'`, because any module load hook makes Deno compile `require("*.json")` as JavaScript (denoland/deno#36240): Express dies inside `statuses`, Hapi inside `@hapi/validate`'s `require('../package.json')`, Koa inside `statuses`' `require('./codes.json')`, and NestJS never starts. Without the hook they run, but transactions are URL-named, there are no child spans and handler errors are not captured automatically.

Verified shapes, all built from shipped exports. A six-line JSON load hook registered before the framework import restores route names and framework spans for Express, Hapi and NestJS. Koa's hook must not be a static import of the entry file, because Deno instantiates the entry's whole module graph, Koa included, before the first statement runs: register it through `--import=./preload.ts` for route names, or defer it with `await import("@sentry/deno/import")` after the app import for driver spans. Bundling with esbuild and `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` gives Hapi and Koa route names, framework spans and error capture with no runtime hook at all. NestJS takes `enableRuntimeChannelInjection: false` as the alternative to the JSON hook, at the cost of route names and framework spans.

Error capture without the hook exists, but not from `@sentry/deno`: `setupExpressErrorHandler(app)` and `attachHapiErrorHandler(server)` live in `@sentry/server-utils` and are not re-exported, and there is no `setupKoaErrorHandler` there at all, so Koa falls back to a hand-written `app.on('error')` whose events carry a manual mechanism.

**Work item.** Once the JSON shim in the Deno milestone ships, re-run the four cells and remove the per-framework workarounds. Re-export the framework error handlers from `@sentry/deno`. Add real-library Deno scenarios for these four (JS-3523).

''' + cells('M-express-deno','M-hapi-deno','M-koa-deno','M-nestjs-deno'))

t(DENO, 'Fresh on Deno: errors swallowed, no route names, and the route Fresh sets is dropped for lack of a context manager', ['JavaScript','Deno','Bug'], 'High', '''
Three separate gaps. Fresh's `App.handler()` catches every route and middleware error and renders its own 500, so nothing reaches Sentry. `captureConsoleIntegration({ levels: ["error"], handled: false })` reports them, but only while Fresh's own handler is the one logging: it goes silent the moment the app registers `app.onError("*")`, and such an app has to call `captureException` inside that handler, or use `setErrorInterceptor` from `jsr:@fresh/core/internal` as the least intrusive alternative. Spans stay unparameterized unless a middleware reads `ctx.route` and calls `updateSpanName` on the root span. Fresh itself sets `http.route` through `trace.getActiveSpan()` from `@opentelemetry/api`, which returns `undefined` because the Deno SDK registers a tracer provider but no context manager, so Fresh's own route enrichment is lost; a context manager bridging the two makes Fresh name its own routes with no middleware at all.

Database spans need `mysql@2`, because `mysql2` dies on the JSON-require bug under the import hook, and every driver listed in both `ssr.external` and `environments.ssr.build.rollupOptions.external`, because `@fresh/plugin-vite` sets `resolve.noExternal: true` and `ssr.external` alone does not survive the build.

**Work item.** Register an OpenTelemetry context manager on Deno so framework-set attributes reach the active span, and consider a Fresh integration for errors and route names.

''' + cells('M-fresh-deno'))

t(DENO, 'Oak on Deno: `app.listen()` runs handlers outside the request context', ['JavaScript','Deno','Bug'], 'Medium', '''
Mounted with `app.listen()`, Oak handlers run outside the request's async context: `getActiveSpan()` is undefined, errors are never captured, and tags and trace ids leak between requests. Nothing in user code repairs it. Mounted with `Deno.serve(app.fetch)`, errors, isolation, incoming trace, database spans and logs work with no extra wiring. Route names need a middleware registered before `app.use(router.routes())` that reads `ctx.matched?.at(-1)?.path` inside `try { await next(); } finally { ... }` and calls `updateSpanName` plus `SENTRY_SEGMENT_NAME_SOURCE` `route` and `http.route` on the root span; the same code placed after `await next()` instead silently skips every request whose handler throws.

`setHttpServerSpanRouteAttribute` from `@sentry/server-utils` does that renaming, and `@sentry/deno` does not re-export it.

**Work item.** Decide whether the `app.listen()` path can be instrumented. At minimum, make the SDK warn when a request handler runs with no active span, re-export the route-attribute helper from `@sentry/deno`, and consider an Oak route-naming integration.

''' + cells('M-oak-deno'))

t(DENO, 'Elysia on Deno: `@sentry/elysia` init delegates to the Bun SDK and never instruments `Deno.serve`', ['JavaScript','Deno','Bug'], 'High', '''
With `Sentry.init` from `@sentry/elysia`, there is no `http.server` span on Deno, every Elysia lifecycle phase becomes its own root transaction on one process-wide trace, incoming `sentry-trace` headers are ignored, and the isolation scope carries the previous request's route into the next event, because that init delegates to `@sentry/bun`.

Two wirings fix it, both from shipped exports and both exercised in the static and the stream lifecycle. Initialize from `@sentry/deno` before `Deno.serve` and import only `withElysia` from `@sentry/elysia`, or keep `Sentry.init` from `@sentry/elysia` and pass `integrations: [denoServeIntegration()]` from `@sentry/deno`. Errors, route names, isolation, incoming trace, database spans and logs then work, with `fetchIntegration()` from `@sentry/elysia`, a re-export of the Bun integration, for outgoing requests. The wiring decides what events report: `sdk.name` `sentry.javascript.deno` in the first, `sentry.javascript.bun` with `contexts.runtime.name` `bun` and session envelopes in the second.

**Work item.** Pick the base SDK by runtime in `@sentry/elysia`. Same root as JS-3582 and JS-3583 on Node.

''' + cells('M-elysia-deno'))

t(DENO, 'Nuxt `deno_server` preset has no request instrumentation', ['JavaScript','Deno','Bug'], 'Medium', '''
With `nitro: { preset: "deno_server" }` and the documented wiring, there are no `http.server` spans, `getActiveSpan()` is undefined in handlers, every request shares one isolation scope and one trace id, and incoming trace headers are ignored. The default `node-server` output run under `deno run` gets route names, `GET /api/users/:id` with source `route` in both lifecycles and `getActiveSpan()` defined in handlers, identical to the Node control, because Nitro's node-server entry uses `node:http`, which the Deno SDK instruments; isolation and incoming trace continuation were measured only on the `deno_server` build, where they fail, so both are unmeasured on `node-server`. Outgoing fetch needs `winterCGFetchIntegration()` from `@sentry/vercel-edge`, an extra install, verified on the `deno_server` build under the stream lifecycle (JS-3517); `fetchIntegration()` from `@sentry/cloudflare`, already a dependency of `@sentry/nuxt`, is the zero-install candidate nobody has run yet.

`deno_server` with `top-level-import` also writes the config import into a file named `.output/server/deno.json start`, and under the static lifecycle drops parentless fetches with `no_parent_span`.

**Work item.** Cover Nitro's `Deno.serve` entry in the `@sentry/nuxt` server side, or state the preset limit in the package and the docs.

''' + cells('M-nuxt-deno'))

t(DENO, 'Next.js on Deno fails every request unless runtime channel injection is off', ['JavaScript','Deno','Bug'], 'High', '''
Next.js 15 App Router builds and serves on Deno 2.9 with `deno run -A node_modules/next/dist/bin/next build` and `start`. With the default `Sentry.init`, every request returns 500 with `SyntaxError: Unexpected token ':'`, because the runtime channel hook makes `require("*.json")` fail (denoland/deno#36240). `enableRuntimeChannelInjection: false` fixes it and is the public option today, though it appears nowhere in the docs. Database spans then come from drivers with their own diagnostics channels (mysql2 3.11+, ioredis 5.11+) and from drivers Sentry bundles and transforms at build time (ioredis below 5.11, with webpack and `buildTimeInstrumentation` on, which `--turbopack` or `buildTimeInstrumentation: false` removes again). mysql 2.x and pg record nothing, because they stay in the server-external packages, and forcing them into the bundle corrupts the driver on Node as well as Deno. Outgoing fetch needs `integrations: [winterCGFetchIntegration()]` from `@sentry/vercel-edge`, already a dependency of `@sentry/nextjs`.

**Work item.** Disable runtime channel injection automatically on Deno until the JSON shim lands, and add the WinterCG fetch integration to the Next.js server defaults when the runtime is Deno.

''' + cells('M-nextjs-deno'))

t(DENO, 'Deno leaks the AsyncLocalStorage store across requests after a dynamic import', ['JavaScript','Deno','Bug'], 'Medium', '''
Deno restores the AsyncLocalStorage store of a handler that awaits a dynamic `import()` into the root async context, permanently. Node with the same build does not. Scope data set during one request (tags, user, contexts, breadcrumbs) then appears on later requests. This is a Deno defect rather than a framework one: it reproduces with zero Sentry, under `Deno.serve` and under `node:http`, and in `vite dev`. Fresh on Deno is confirmed broken because each route chunk loads lazily on its first request, which guarantees the dynamic import; Nuxt on the `deno_server` preset is partial, and SolidStart on Deno shows the same symptom without the mechanism being established for that stack. The app-level mitigation is a first middleware that scrubs the inherited isolation scope, clearing tags, contexts, extra, user, breadcrumbs and attachments off `getIsolationScope()`; `withIsolationScope(new Scope(), ...)` is not a substitute, it cleans the events and then attributes each request's tags to the following transaction.

**Work item.** File the upstream Deno bug with the minimal reproduction from the Fresh cell, and evaluate an SDK-side guard: a fresh isolation scope per `Deno.serve` request that does not inherit a stale store.

''' + cells('M-fresh-deno','M-nuxt-deno','M-solidstart-deno'))

t(CF, 'No warning when a Worker is bundled without build-time instrumentation', ['JavaScript','Cloudflare Workers','Improvement'], 'High', '''
Express, Koa, Hapi and NestJS boot on workerd behind `enable_nodejs_http_server_modules` and `httpServerHandler` from `cloudflare:node`, and Fresh and Elysia run as plain fetch handlers. A Worker bundled by `wrangler dev` or `wrangler deploy` alone gets none of the build-time channel injection: no framework spans, no database spans, and route names and error capture only where the app adds them by hand. Built with `sentryCloudflareVitePlugin()` from `@sentry/cloudflare/vite`, or with `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` for non-Vite builds, all of them arrive. Nothing says so: on the plain build `debug: true` lists only Dedupe, EventFilters, FunctionToString, ConversationId, LinkedErrors, Fetch, HttpServer, RequestData, Console and SpanStreaming, with no line reporting that build-time instrumentation is missing. On Bun the same situation prints a debug-level line (JS-3508); on Cloudflare there is nothing.

What the app can still do bounds the ask. Express takes `setupExpressErrorHandler(app)` from `@sentry/server-utils` plus `patchExpressModule(express, () => ({}))` from `@sentry/core/server`, the latter stream-lifecycle only and on a deprecated API; Koa takes `app.on('error', ...)` plus a manual `updateSpanName`, which lands on source `custom`; Hapi takes a four-line `onPreResponse` rename. Database spans have no plain-`wrangler` equivalent at all, except on Oak, whose `mysql` 2.x driver publishes its own channels.

**Work item.** Detect at init on workerd that no channel injection happened and warn at the default log level, naming both plugins. Document `sentryOrchestrionPlugin`, which is exported from seven entry points and appears in the docs once, in the v10-to-v11 migration guide.

''' + cells('M-express-cf','M-koa-cf','M-hapi-cf','M-nestjs-cf','M-fresh-cf','M-elysia-cf'))

t(CF, 'Koa on Workers: instrumented `use()` starts a span at startup, which workerd rejects', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
Creating the Koa app at module scope makes the Worker fail to start with `Disallowed operation called within global scope`, because the instrumented `app.use()` starts a span outside any request. The app, every `use()`, the router wiring and `app.listen()` must run inside the fetch handler behind a memoized promise; `httpServerHandler({ port })` may stay at module scope. Express and Hapi hit the same wall from their own module-scope route registration once build-time instrumentation is on. With the lazy construction and the Vite plugin build, all seven capabilities pass, including `auto.middleware.koa` errors, whose listener the Koa integration attaches itself, and `http.route`.

**Work item.** Make the Koa `use` instrumentation record nothing when there is no active request or isolation scope, so module-scope construction works on workerd.

''' + cells('M-koa-cf'))

t(CF, 'Hapi on Workers: an early `close` turns every response into a 499 and the error event never fires', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
On workerd the response emits `close` before `finish` with `writableEnded` still false. Hapi reads that as a client disconnect, answers 499, and its `request` and `error` events never fire, so `hapiIntegration` captures nothing. An app-side `onRequest` extension that drops the premature `close` before Hapi's transmit sees it restores capture, the transaction name and the `auto.function.hapi` mechanism; an `onPreResponse` extension that calls `captureException` when `request.response.isBoom` is the fallback. Route names, isolation, incoming trace, outgoing fetch, database spans and logs work with build-time instrumentation, and a four-line `onPreResponse` rename gets route names on a plain `wrangler` build as well.

`hapiIntegration()` is neither a Cloudflare default integration nor re-exported by `@sentry/cloudflare`, so it has to be imported from `@sentry/server-utils` by hand.

**Work item.** Handle the early `close` inside `hapiIntegration` or the Cloudflare HTTP server shim, so Hapi on workerd needs no app-side extension. Re-export `hapiIntegration` from `@sentry/cloudflare`, or add it to the defaults there.

''' + cells('M-hapi-cf'))

t(CF, 'SvelteKit on Workers: the segment span keeps the URL and never gets the route id', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
Unlike the Node SvelteKit SDK, the transaction or segment span on Workers is named by the Cloudflare request handler and keeps the raw URL: `GET /users/42` with source `url` under the static lifecycle, bare `GET` under the default stream lifecycle. The SvelteKit route id and `http.route` only reach a child span. This hits every route except `/`, because the Cloudflare wrapper keeps only a name whose source is already `route`, and SvelteKit's own `kit.experimental.tracing.server` makes it worse rather than better: on Cloudflare it removes the route-named `http.server` span entirely and leaves the route as an attribute on a function span. A user-land `handle` inserted between `initCloudflareSentryHandle` and `sentryHandle` fixes it in both lifecycles: take `getRootSpan(getActiveSpan())` from `@sentry/sveltekit`, call `updateName` with the method and `event.route.id`, then set `sentry.segment.name.source` to `route` and `http.route`. `Sentry.updateSpanName` is the wrong call there, it stamps source `custom`.

Database spans come from the transform `sentrySvelteKit()` already installs, but on a flat `node_modules` (npm or Yarn) the build fails until `ssr: { noExternal: ['@sentry/core', '@sentry/conventions', '@opentelemetry/api'] }` is added; pnpm needs nothing. The `/^@sentry\\//` regex is not the shortcut it looks like, it force-bundles `@sentry/sveltekit` and boots the Node SDK inside the Worker.

**Work item.** Have `sentryHandle` rename the root span from `event.route.id` on Cloudflare, and look at why the flat install needs `noExternal`.

''' + cells('M-sveltekit-cf'))

t(CF, 'Nuxt on Workers: parameterless routes are named by method only', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
With the documented `sentryCloudflareNitroPlugin` wiring, six of seven capabilities pass, once two `nuxt.config.ts` settings that no page mentions are added: `nitro.cloudflare: { nodeCompat: true, deployConfig: false }`, and `nitro.alias: { 'readable-stream': 'node:stream' }` for the bundled mysql driver. Only routes with parameters, such as `/api/users/[id]`, get their route pattern; a parameterless route such as `/api/health` is reported as bare `GET` under the stream lifecycle and as the request URL under static. A second Nitro plugin hooking `beforeResponse` that renames the root span from `event.context.matchedRoute` with `getActiveSpan`, `getRootSpan` and `spanToJSON` produced identical output to a patched SDK. Verification has to run on a build, `nuxt build` and then `wrangler dev`, because the SDK is inert under `nuxt dev`.

**Work item.** Rename the root span from the matched Nitro route inside `sentryCloudflareNitroPlugin`.

''' + cells('M-nuxt-cf'))

t(CF, 'Remix on Workers: the bare `@sentry/remix` import captures nothing in a webworker SSR build', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
In a Remix Vite build with `ssr.target: "webworker"`, `import * as Sentry from "@sentry/remix"` resolves to the browser build, `handleError` ends up undefined, and no error is captured, with only a rollup warning. The same code imported from `@sentry/remix/cloudflare` captures loader, action and resource-route errors and thrown 5xx responses on both lifecycles. Per-request isolation needs `withSentry` from `@sentry/cloudflare` around a handler built with `instrumentBuild`, and `makeWrappedCreateRequestHandler` from `@sentry/remix/cloudflare` must not be added on top: on Cloudflare it reports every request twice, as two `http.server` transactions in two traces. With `instrumentBuild` alone the event's `transaction` field stays unset, because nothing calls `isolationScope.setTransactionName`, so error grouping loses the route. `wrapRequestHandler` from the `/request` entry establishes no isolation on Workers at all (separate ticket). Database spans need `sentryCloudflareVitePlugin()` in the Vite config; without it, queries run, no span appears, and nothing warns.

Build with `remix vite:build`: a plain `vite build` under Vite 6 silently builds only the client and skips `build/server`.

**Work item.** Make the bare import fail loudly in a webworker build, or resolve it to the Cloudflare entry through the export conditions. Set the isolation scope's transaction name from the Remix route so events carry one.

''' + cells('M-remix-cf'))

t(CF, 'Next.js via OpenNext: outgoing fetch is uninstrumented without the Cloudflare fetch integration', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
With the documented OpenNext wiring, errors, route names, isolation, incoming trace and logs pass. Outgoing `fetch` and `node:http` requests produce no `http.client` span and carry no `sentry-trace` or `baggage` header, because the Workers runtime provides a native fetch that the Node HTTP instrumentation never sees. Installing `@sentry/cloudflare` explicitly (it is not a transitive dependency of `@sentry/nextjs`) and adding `fetchIntegration()` from it to `sentry.server.config.ts` restores both, `node:http` calls included. `next.config` has to stay CommonJS: `import { withSentryConfig } from '@sentry/nextjs'` in an ESM `next.config.mjs` fails with `Named export 'withSentryConfig' not found`, because the exports map puts the CJS `node` condition ahead of `import`.

Database spans exist only for drivers that publish their own diagnostics channels, and mysql2 needs `disableEval: true` or `pool.query` throws `EvalError: Code generation from strings disallowed`; mysql 2.x produces none. The symptom at init is `Failed to register diagnostics-channel injection hooks, so channel-based integrations will not record spans` with `TypeError: port1.on is not a function`, and `serverExternalPackages` is not an escape hatch, the spans arrive and the driver breaks with `PROTOCOL_INCORRECT_PACKET_SEQUENCE`.

**Work item.** Add the Cloudflare fetch integration to the Next.js server defaults when the runtime is workerd.

''' + cells('M-nextjs-cf'))

t(CF, 'SolidStart on Workers: no server-side code path and no server-to-client trace', ['JavaScript','Cloudflare Workers','Feature'], 'Medium', '''
`@sentry/solidstart` has no Cloudflare export; its server entry initializes the Node SDK. The verified shape keeps `@sentry/solidstart` for the browser and wraps the built Nitro handler with `withSentry` from `@sentry/cloudflare` in a hand-written `worker.mjs`, with `@sentry/cloudflare` kept external through `server.rollupConfig` so Nitro does not inline a second copy. Skipping that external fails silently rather than loudly: `Sentry.setTag` and `captureException` in a route handler then run against an uninitialised client while the wrapper's request transactions keep arriving, so the setup looks healthy. Nitro emits no wrangler config for the `cloudflare-module` preset either, so `wrangler.jsonc` is hand-written too. Server errors need a Nitro plugin that forwards the `error` hook to `captureException`, and errors thrown while a page renders on the server stay uncaptured even with it, because SolidStart streams the render through a detached pipe. Route names come from the raw URL with source `url` under `static` and collapse to a bare `GET` under the default stream lifecycle, and nothing injects a `sentry-trace` meta tag into the SSR HTML, so there is no server-to-client continuation. Database spans were not exercised.

**Work item.** A `@sentry/solidstart/cloudflare` path: init from the Cloudflare SDK, the error hook, route naming from the file-route table, and the meta tags. Or a documented limit.

''' + cells('M-solidstart-cf'))

t(CF, 'Fresh on Workers: the Sentry Vite plugin breaks the driver when no worker environment exists', ['JavaScript','Cloudflare Workers','Bug'], 'Low', '''
Fresh's own Vite plugin emits `_fresh/server.js` whose default export is already a fetch handler, so it runs on Workers with no adapter. Putting `sentryCloudflareVitePlugin()` into Fresh's `vite.config.ts` is worse than a no-op: there is no Cloudflare worker environment for it to instrument, so it injects the channels and then breaks the database driver under workerd through Vite's CJS interop. The working shape keeps the SDK and the driver external to the SSR build and bundles the wrangler entry separately with the orchestrion esbuild plugin, whose banner has to define a `globalThis.require` backed by static `node:*` imports or workerd dies at the first query on `Dynamic require of 'diagnostics_channel' is not supported`.

Errors are swallowed by Fresh's default handler, as on the other runtimes. Route names are not automatic either, because Fresh renames through `@opentelemetry/api` while `@sentry/cloudflare` registers no OpenTelemetry global, so those calls land on a no-op tracer; one `main.ts` middleware registered before `app.fsRoutes()` produces `GET /users/:id` with source `route` in both lifecycles, renaming inside a `finally` and setting the source after the rename.

**Work item.** Make the Cloudflare Vite plugin a no-op with a warning when the Vite config has no worker environment, instead of injecting channels it cannot support.

''' + cells('M-fresh-cf'))

t(CF, 'Decision: Fastify does not run on Cloudflare Workers', ['JavaScript','Cloudflare Workers','Task'], 'Low', '''
Fastify 5.12.3 behind `httpServerHandler` with `nodejs_compat` and `enable_nodejs_http_server_modules`: constructing the app at module scope throws `Disallowed operation called within global scope`, because Fastify's boot generates random values and schedules work. Constructing it lazily on the first request then fails when any route is registered, because the router compiles matchers with `new Function` and Workers forbid runtime code generation, with no compatibility flag that lifts it. Declaring a route schema is not an escape either, ajv and fast-json-stringify compile the same way. Fastify 4 behaves the same. A plain `node:http` server behind the same config serves 200s, so the Cloudflare entrypoint is fine and it is the framework that cannot be constructed. No Sentry capability could be exercised.

**Work item.** Record the decision and state it in the Cloudflare and Fastify docs (audit DOC-F38). No SDK work.

''' + cells('M-fastify-cf'))

t(BUNG, 'Bun garbage-collects the diagnostics channels the SDK subscribes to', ['JavaScript','Bun','Bug'], 'High', '''
Bun's `node:diagnostics_channel` holds channels weakly and collects a channel together with its subscribers when nothing keeps a strong reference. The SDK drops the channel object it subscribes to (`packages/server-utils/src/tracing-channel.ts:200-208`, `packages/server-utils/src/integrations/mysql.ts:79-80`), so an instrumented module that first evaluates inside a request, such as mysql's lazily required `lib/Connection.js` or a driver imported dynamically in a handler, never gets spans. Reproduced on develop (10.67.0) on bun 1.4.0, re-run on 1.4.2, and on the CI pin bun 1.3.14, which behaves identically; and with no SDK at all, where a plain `dc.tracingChannel(name).subscribe(...)` at module scope loses its subscription the same way. Node keeps subscribed channels alive. It is why the database-span cells of seven framework SDKs on Bun (Hono, Next.js, SvelteKit, Astro, React Router, TanStack Start and SolidStart) each carry a channel pin or a driver-import workaround.

Workarounds: import drivers and create pools at module scope, or pin the channels after `Sentry.init()` with `dc.tracingChannel(name)` held on `globalThis`.

**Work item.** Retain the channel references in the SDK. File the Bun report with the minimal probe.

''' + probes('X02','B17'))

t(BUNG, 'The missing-injection warning fires on a plugin build started with `--preload`, although the bundled instrumentation is active', ['JavaScript','Bun','Bug'], 'Medium', '''
`detectOrchestrionSetup()` (`packages/server-utils/src/orchestrion/detect.ts:34-42`) runs inside `Sentry.init()` and warns `[Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans.` when neither the runtime marker nor the bundler marker is set. The bundler marker is written by the entry banner of the plugin build (`ORCHESTRION_BUNDLER_MARKER_BANNER` in `packages/server-utils/src/orchestrion/bundler/moduleInjectedTransform.ts:31-35`), which runs when the bundle evaluates. Under `bun --preload ./instrument.ts dist/app.js`, the documented way to load the SDK on Bun, `init()` runs in the preload before the bundle, so the check reads an unset marker and warns. The instrumentation still works: the per-module snippets subscribe when each transformed module evaluates.

Measured on Bun 1.4.2 with `@sentry/bun` 10.67.0 (develop) and `graphql` 16.14.2, a channel-instrumented library that needs no server, `debug: true` in every run:

- Plugin build + `--preload` (variant `graphql-bundle-preload`): the warning prints at app start (`app-graphql-bundle-preload.log:101`), and the `GET /graphql` request still records `GraphQL parse`, `GraphQL validate` and `GraphQL query` child spans. The warning is false.
- Unbundled + `--preload` (variant `graphql-preload`): the warning prints and the request records no GraphQL span. The warning is right.
- Plugin build with `import "./instrument"` as the first line of the entry, run without `--preload` (variant `graphql-bundle-inline`): no warning, `[Sentry] Bundler plugin ran, injected libraries=[]` instead, and the same three GraphQL spans. The library list is empty at init time because the per-module snippets have not run yet, which the detection comment already allows for.

A reader who follows the Bun guide, adds the plugin build step and keeps `--preload`, gets told their setup is broken while it is not. Nothing corrects the line later.

**Work item.** Defer the verdict until the entry has evaluated (a microtask or the first `orchestrion.module-injected` event), or record on the preload path that a plugin banner may still arrive and downgrade the line to a log. The docs note for the unbundled path, where the line is correct, is DOC-Q4.

**Evidence.** Getting-started reproduction `quickstarts/bun/`, variants `graphql-bundle-preload`, `graphql-preload` and `graphql-bundle-inline` (`run.sh`, `app-graphql.ts`, `app-graphql-inline.ts`, `build-graphql.ts`, `results-graphql-*.json`, `app-graphql-*.log`), run on 2026-09-10 with the 10.67.0 develop tarballs. Runtime docs audit, September 2026.

''')

t(DENOG, 'Ship a JSON load-hook shim for the module hook', ['JavaScript','Deno','Bug'], 'High', '''
Registering any `Module.registerHooks` load hook on Deno 2.9 makes CommonJS `require("*.json")` compile as JavaScript (denoland/deno#36240, fix in denoland/deno#36243, both open). Under `@sentry/deno/import` that breaks Express, Hapi, Fastify, mysql2, Koa's dependencies and NestJS at import with `SyntaxError: Unexpected token ':'`, and under the runtime channel injection it turns every Next.js request into a 500. A second load hook that delegates and sets `format: "json"` for `.json` URLs works around it, verified with the hook on and off. The public option today is `enableRuntimeChannelInjection: false`, which buys a process that boots at the price of every channel-based integration.

**Work item.** Register that shim in `register.ts` until the Deno fix ships, with a version check to drop it afterwards.

''' + probes('D-JSON','X03'))

t(DENOG, '`denoCronIntegration` crashes `init` on Deno 2.9, and its JSDoc claims a default it is not', ['JavaScript','Deno','Bug'], 'High', '''
`packages/deno/src/integrations/deno-cron.ts:23` assigns `Deno.cron = new Proxy(Deno.cron, ...)`. On Deno 2.8.3, the CI pin, `Deno.cron` is a writable data property and the integration works, sending one `in_progress` and one `ok` check-in. From Deno 2.9.0 it is a getter-only accessor, so `Sentry.init` with this integration throws `TypeError: Cannot set property cron of #<Object> which has only a getter` and the process exits 1. The guard at lines 18-21 returns silently when `Deno.cron` is absent, so without `--unstable-cron` the integration is an inert no-op with no warning while the reader's own `Deno.cron(...)` throws `TypeError: Deno.cron is not a function`. The JSDoc at line 64 says "Enabled by default", but the integration is not in the default set at `packages/deno/src/sdk.ts:31-49`.

The fix is in the repository already, one file over. `denoServeIntegration` wraps `Deno.serve` with `Object.defineProperty` inside a try/catch (`packages/deno/src/integrations/deno-serve.ts:111-124`), including the `writable: true` comment that explains why. `denoCronIntegration` was never updated to match.

Measured on Deno 2.9.0 on 2026-09-11, with `--unstable-cron`: the property descriptor of `Deno.cron` is a getter with no setter, and `configurable: true`. Plain assignment throws the message above; `Object.defineProperty(Deno, 'cron', { value: proxy, writable: true, configurable: true, enumerable: true })` succeeds, and the proxy still intercepts, a real `Deno.cron('slug', schedule, opts, fn)` registration ran the `apply` trap and returned normally. Without the flag `Deno.cron` is `undefined` and no descriptor exists, so the guard is right to return; only its silence is wrong.

**Work item.** Three parts, all local to `deno-cron.ts`:

- Replace the assignment with the `Object.defineProperty` plus try/catch shape of `deno-serve.ts:111-124`.
- Warn on the guard path (`debug.warn('Deno.cron is not available. Run with --unstable-cron ...')`), the convention `deno-serve.ts:123` and `transports/index.ts:22` already use.
- Fix the JSDoc at line 64, which claims a default the SDK does not apply.

Add Deno 2.9 to CI (JS-3524) so the version split is covered.

**Docs sequencing.** The docs item DOC-R2 currently tells readers the integration is broken on Deno 2.9.0 and later. If this fix ships in v11, that wording has to become a minimum SDK version instead. Land the SDK change first, or write the docs change to name both.

''' + probes('D11'))

t(DENOG, 'The import hook is silent when it transforms nothing', ['JavaScript','Deno','Improvement'], 'Medium', '''
Three cases end with no instrumentation and no message. The hook needs the package resolvable from a local `node_modules`, so `deno.json` has to set `nodeModulesDir` to `"auto"`, or to `"manual"` with an install step, which is what every Deno e2e app and every cell in this audit does; without one nothing is injected. Without `--allow-env` the first-line import crashes with `NotCapable: Requires env access` before `Sentry.init` runs. The `--import=@sentry/deno/import` form shown in the package README is resolved as a file path and rejected with `Module not found`; only the first-line import or `--import=./node_modules/@sentry/deno/build/import.mjs` registers the hook. `init()` itself never warns when the hook is absent (#23892).

**Work item.** One diagnostic path: warn at init when no injection happened, say why when it can be known (package not resolvable from `node_modules`, hook not registered), and accept the bare specifier or fix the README.

''' + probes('D02','D-HOOK'))

t(DENOG, 'Events report the package as `denoland:sentry`', ['JavaScript','Deno','Bug'], 'Low', '''
`packages/deno/src/client.ts:36` sets `sdk.packages[0].name` to `denoland:sentry`, while the package ships on npm only and every documented install uses `npm:@sentry/deno`.

**Work item.** Report `npm:@sentry/deno`, matching the other SDKs.

''' + probes('D02'))

t(CFG, 'Errors inside `ctx.waitUntil()` are never captured', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
An error thrown or a promise rejected inside `ctx.waitUntil(promise)` is never captured. `packages/cloudflare/src/client.ts:285` hands the promise to the invocation's `waitUntil` and does nothing else, and `captureException` has zero occurrences in `packages/cloudflare/src/flush.ts`, so no error-capture path is attached on any lifecycle. What was measured is the stream lifecycle: workerd logs `Uncaught Error` for both the throwing function and the rejected promise, the routes answer 200, and the sink receives nothing before the sentinel. `ctx.waitUntil(work().catch(e => Sentry.captureException(e)))` is the app-side shape.

**Work item.** Wrap the promise handed to `waitUntil` so a rejection is captured once, then rethrown.

''' + probes('C01'))

t(CFG, 'Dedupe drops repeated errors across requests with the cached client', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
On develop the client is cached per isolate, so the Dedupe integration's state survives across requests. It then treats an identical error thrown in a later request as a duplicate: hitting the same failing route twice sends one event, and a repeated `captureMessage` is dropped with `Event dropped due to being a duplicate of previously captured event.` until a different event intervenes. Seen on Pages and on Workers, and inside Workflows. On 10.73.0, with a client per request, every hit produced an event. Two workarounds were verified: `cacheClient: false` in the SDK options, which restores the per-request delivery, or keeping the cached client and dropping the integration with `integrations: defaults => defaults.filter(i => i.name !== 'Dedupe')`.

**Work item.** Reset the dedupe state per request, or leave Dedupe out of the Cloudflare defaults when the client is cached.

''' + probes('C10','C14','C26'))

t(CFG, 'The `/request` entry runs without an async-context strategy under the stream lifecycle', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
`wrapRequestHandler` from `@sentry/cloudflare/request` sets up a reduced client and is the one Cloudflare wrapper that never calls `setAsyncLocalStorageAsyncContextStrategy`. Under the default stream lifecycle a request without I/O is sent as a legacy transaction envelope and a following event was dropped; `traceLifecycle: "static"` avoids it, and so does calling `setAsyncLocalStorageAsyncContextStrategy()` from `@sentry/server-utils/no-diagnostic-channels` at module scope, which needs the `nodejs_als` flag. 10.73.0 is unaffected because it defaults to the static lifecycle. Without the strategy there is no per-request isolation either: every `setTag`, `setUser` and request-data write is global to the isolate and bleeds into later requests, and no event carries request data. Remix wired through this entry loses isolation for that reason, and the two Hydrogen framework pages document exactly this shape, which exists for runtimes that cannot enable `nodejs_compat`.

**Work item.** Set the strategy in the request entry whenever AsyncLocalStorage is available, and otherwise force the static lifecycle there with a warning.

''' + cells('M-remix-cf') + ' Also probe record C09 in the deep probe report.')

t(XP, 'SolidStart names transactions by URL and swallows API-route errors on every runtime', ['JavaScript','Bug'], 'Medium', '''
SolidStart mounts the whole app as one Nitro catch-all handler, so the SDK's Nitro route parameterization never fires: server transactions arrive as `GET /users/456` with source `url` on Node, Bun, Deno and Workers, and collapse to a bare `GET` under the stream lifecycle. Errors thrown in a file API route (`src/routes/api/*.ts`) or during page render are turned into a 500 by SolidStart's internal h3 app before Nitro's error hook, so no event is sent, and the guide's own verification snippet is exactly that unreported case. API-route errors are recoverable from user land, with a try/catch h3 middleware registered first in the array form of `createMiddleware` and spreading the nested `sentryBeforeResponseMiddleware()`, and server functions are already covered by `withServerActionInstrumentation`; page-render errors stay dark on every runtime, and on Workers the Nitro error plugin cannot reach them either, because the render is streamed through a detached pipe.

Route names are recoverable too, but only through a helper the framework package does not re-export: `setHttpServerSpanRouteAttribute` from `@sentry/server-utils` names API routes from `event.params` in `onBeforeResponse` and SSR pages from `useCurrentMatches`, and renames the segment span only.

**Work item.** A SolidStart middleware in `@sentry/solidstart` that names the span from the route manifest and captures API-route errors.

Generalized by "Server segments keep a method-only name although the framework knows the route", which records the same symptom on TanStack Start and Nuxt with a cause of its own on each.

''' + cells('M-solidstart-bun','M-solidstart-deno','M-solidstart-cf'))

t(XP, 'Package READMEs show wiring that does not resolve', ['JavaScript','Task'], 'Low', '''
`packages/deno/README.md:70` and `src/import.mjs:10` show `--import=@sentry/deno/import`, which Deno resolves as a file path and rejects with `Module not found`. `packages/cloudflare/README.md:88` and `:99` import `wrapRequestHandler` from the main entry, which develop no longer exports (`packages/cloudflare/src/index.ts:117` exports only `_INTERNAL_wrapRequestHandler`); it lives on `@sentry/cloudflare/request`.

**Work item.** Fix both READMEs in one PR.

''' + probes('D-HOOK','CF-EXPORTS'))

t(BUNT, 'Add e2e apps for the verified Bun framework cells', ['JavaScript','Bun','Tests'], 'Medium', '''
Bun has e2e apps for Elysia, Next.js and mysql, and integration suites for Hono and two drivers. No Bun app runs Express, Koa, Hapi, Fastify, Oak, Fresh, NestJS, Remix, SolidStart, SvelteKit, Astro, React Router, TanStack Start or Nuxt, although all fourteen were exercised with the wiring in the cell records, thirteen of them across every capability the cell drove. TanStack Start is the exception: isolation, incoming trace and outgoing fetch are recorded broken there, so its app would be a regression test for those, not a green one. Each cell in the reproduction folder is a runnable app with a README that lists install, run and expected output.

**Work item.** Port the cells into `dev-packages/e2e-tests/test-applications/`, one per framework, starting with the four Node HTTP frameworks on the plugin build.

''' + '**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-bun` directories), and the framework grid in the [deep probe report](%s).' % REPORT)

t(DENOT, 'Add e2e apps for the verified Deno framework cells', ['JavaScript','Deno','Tests'], 'Medium', '''
Only `hono-4 (deno)` runs a real framework on Deno in CI; the Deno orchestrion suites publish channels by hand (JS-3523). Sixteen framework cells were verified on Deno 2.9, with the wiring in their records. Fastify works with no hook at all, SvelteKit and Astro need one fetch integration added, Next.js needs `enableRuntimeChannelInjection: false` next to that integration, Nuxt has to keep the `node-server` output, and the rest need the JSON load hook or the esbuild build.

**Work item.** Port the cells into e2e apps, starting with Fastify, Next.js, Nuxt, SvelteKit and Astro, and add Deno 2.9 to the runner (JS-3524).

''' + '**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-deno` directories), and the framework grid in the [deep probe report](%s).' % REPORT)

t(CFT, 'Make the Cloudflare framework e2e apps required and add the missing ones', ['JavaScript','Cloudflare Workers','Tests'], 'Medium', '''
`react-router-8-cloudflare`, `tanstackstart-react-cloudflare` and `sveltekit-3-cloudflare-workers` are `optional` in CI (`.github/workflows/build.yml:1131`), so the wiring the Cloudflare framework pages describe does not run on pull requests. No app covers Express, Koa or Hapi behind `httpServerHandler` with the Vite plugin, NestJS or Fresh on the esbuild orchestrion build, Elysia with `aot: false`, Oak, Remix through `@sentry/remix/cloudflare`, or SolidStart.

**Work item.** Promote the three apps to required and port the nine missing cells.

''' + '**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-cf` directories), and the framework grid in the [deep probe report](%s).' % REPORT)

for rt, ids in [('Bun', 'DOC-B1, DOC-B2, DOC-B3, DOC-B4, DOC-Q4, DOC-R1 (Bun include), DOC-R8, DOC-R11, DOC-R12, DOC-F1 to DOC-F17'), ('Deno', 'DOC-D1 to DOC-D6, DOC-R2, DOC-R5, DOC-R6, DOC-R7, DOC-R8, DOC-R11, DOC-R17, DOC-F18 to DOC-F34'), ('Cloudflare', 'DOC-C6, DOC-C7, DOC-C8, DOC-Q2, DOC-Q6, DOC-R4, DOC-R7, DOC-R10, DOC-R11, DOC-R13 to DOC-R16, DOC-R18, DOC-R19, DOC-F35 to DOC-F51')]:
    t(DOCS, 'Track the %s docs issues from the runtime docs audit' % rt, ['JavaScript','Task'], 'Medium', '''
Tracking ticket for the `getsentry/sentry-docs` issues that come out of the runtime docs audit for %s. Items: %s. The v11-gated Cloudflare items (DOC-C1 to DOC-C5), X2 and DOC-R20 are owned by the Major Release 11.0 project and are not listed here, and neither are DOC-Q1 and DOC-Q3, which land with the v11 docs update on all four guides at once. DOC-Q5 is a Node getting-started item and belongs to none of the three runtime lists.

**Work item.** Link each GitHub issue as it is filed; close when the last one is merged.

**Evidence.** [Docs audit](%s) with the proposed issue text per item
''' % (rt, ids, AUDIT))

def qs(*rts):
    return '**Evidence.** Getting-started reproduction%s %s, run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.' % ('s' if len(rts)>1 else '', ', '.join('[`quickstarts/%s/`](%s/quickstarts/%s)' % (r, REPRO, r) for r in rts))
def gs(*apps):
    return '**Evidence.** Getting-started reproduction%s %s, run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.' % ('s' if len(apps)>1 else '', ', '.join('[`quickstarts/%s/`](%s/quickstarts/%s)' % (a, REPRO, a) for a in apps))

t(CFG, 'Cloudflare Vite plugin: a wrangler config resolved to the wrong default-named file instruments nothing, silently', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
`sentryCloudflareVitePlugin()` already warns through the Vite logger when no wrangler config parses at all (`packages/cloudflare/src/vite/autoInstrument.ts:34-40`). The case that warning does not cover is a project holding more than one wrangler file: the plugin resolves the first default-named `wrangler.json`, `wrangler.jsonc` or `wrangler.toml` at the Vite root, reads the entry point and classes from that file, and instruments nothing for the Worker actually being built. A config was found, so nothing is logged. The recorded run produced an empty sink, an uncaught error in the worker log and `{"sentry-trace":null,"baggage":null}` at the recorder, with the build reporting success throughout.

Two neighbouring paths turned out not to be defects. The `instrument.server.{ts,js,mjs,cjs}` file is documented at `vite-plugin.mdx:88-99`, and its absence is a deliberate hand-off rather than a silent failure: `ENV_FALLBACK_OPTIONS_FN` (`packages/cloudflare/src/vite/instrumentFile.ts:7`) leaves `packages/cloudflare/src/options.ts:68` to resolve `dsn ?? getEnvVar(env, 'SENTRY_DSN')`, so the Worker runs without a DSN only when `env` carries none either. With `wranglerConfigPath` and the options file in place the built Worker delivered the same errors, spans, headers and logs as a hand-written `withSentry`.

**Work item.** Warn, or fail the build, when the resolved wrangler config is not the one being built, and say how to tell: with auto-instrumentation working the built entry contains a `withSentry` wrapper. The docs half is DOC-Q2, now P1.

''' + qs('cloudflare'))

t(CFG, 'Cloudflare segment span reports status ok on a 500 response', ['JavaScript','Cloudflare Workers','Spans','Bug'], 'Medium', '''
A `withSentry` route that throws answers 500 through wrangler, and the error event arrives with mechanism `auto.http.cloudflare`, but the segment span of that request is emitted with `status: "ok"` and no `http.response.status_code` attribute, which the 200 routes do carry. `wrapRequestHandlerWithInit` calls `span.end()` in its catch without setting an error status. Node, Bun and Deno mark the same route `internal_error`. The Oak on Workers cell and the Pages middleware probe record the same span.

**Work item.** Set the span status from the thrown error in the Cloudflare request wrapper, the way the other runtimes do.

Generalized by "A server segment with no response keeps status ok", which records the same defect on Connect, SvelteKit and Cloudflare Pages.

''' + qs('cloudflare') + ' Also probe records C01 and C10 in the deep probe report.')

t(DENOG, 'The Deno import hook requires `--allow-env` at module load through the vendored debug package', ['JavaScript','Deno','Bug'], 'Medium', '''
With `import "@sentry/deno/import"` as the first line and the permission flags the Deno guide shows (`--allow-net` at `index.mdx:100`, `--allow-read` at `:119`), the process exits before the app starts: `NotCapable: Requires env access, run again with the --allow-env flag`, raised from `node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124` reading `process.env` at module load, not from a Sentry check with a readable message. Without the hook line the same flags run, and the SDK silently drops `server_name`, the OS version, context lines and `app://` frame paths, which need the `--allow-sys=hostname,osRelease` and `--allow-read` the guide never names together.

**Work item.** Guard the environment reads in the vendored `debug` (or read them lazily) so the hook loads without `--allow-env`, and warn once instead of degrading silently when a permission is missing.

''' + qs('deno'))

t(XP, 'Error events on Bun and Cloudflare carry no `transaction` field', ['JavaScript','Bun','Cloudflare Workers','Bug'], 'Medium', '''
The same throwing route produces an error event with `transaction: "GET /debug-sentry"` on Node and no `transaction` key at all on Bun (`Bun.serve`, even with a `routes` map that names the server span `GET /users/:id`) and on Cloudflare (`withSentry`). Deno sets none either. Issues from those runtimes have no transaction to group or filter by.

**Work item.** Set `event.transaction` from the active segment span name in the Bun, Deno and Cloudflare request wrappers, as the Node request integration does.

''' + qs('node','bun','deno','cloudflare'))

t(XP, '`debug: true` prints no SDK name, version or runtime on any runtime', ['JavaScript','Improvement'], 'Low', '''
With `debug: true`, Node prints `Initializing Sentry: process: <pid>, thread: main.` and the list of installed integrations; Bun prints the same banner; Deno and Cloudflare print no banner at all. None of the four prints the SDK name, the SDK version, or the runtime name and version. In every reproduction those had to be read off the envelopes. A support thread that starts with "enable debug and paste the output" gets no identity line.

**Work item.** Print one line at init with SDK name, version, runtime name and version, on every runtime.

''' + qs('node','bun','deno','cloudflare'))

t(XP, 'Source maps are deleted after a build that uploaded nothing', ['JavaScript','Bug'], 'High', '''
Without an auth token the bundler plugin logs `Will not upload source maps` and then deletes the maps the framework plugin had just told it to generate, so a build that reads as green ships with no source maps and nothing says so. SolidStart deleted 3,543 `*.map` files (DOC-Q104, `results-import-src.json`), Nitro left no `*.map` anywhere under `.output` (DOC-Q80, `results-start.json`), the Next.js Turbopack path left `.next/static` with zero maps and no `sourceMappingURL` (DOC-Q89, `results-app-router.json`), and Astro deleted the hidden maps it had switched on itself (DOC-Q100, `results-build-base.json`).

Each framework plugin fills `sourcemaps.filesToDeleteAfterUpload` on the user's behalf, and the deletion runs whether or not an upload happened: `packages/solidstart/src/vite/sourceMaps.ts:117-124`, `packages/astro/src/integration/index.ts:71-75`, `packages/nitro/src/sourceMaps.ts:89-90`, `packages/nextjs/src/config/getBuildPluginOptions.ts:301-310`.

**Work item.** Skip the automatic deletion when no upload was attempted, and say once at build time that the maps were kept.

''' + gs('solidstart','nitro','nextjs','astro'))

t(XP, 'The automatic delete glob does not match the build output directory', ['JavaScript','Bug'], 'Medium', '''
Two of the automatic `filesToDeleteAfterUpload` defaults point somewhere other than the directory the build wrote to. `packages/solidstart/src/vite/sourceMaps.ts:124` sets `["./**/*.map"]`, the whole project root: one SolidStart build deleted 3,543 maps, 3,519 of them under `node_modules/` and 24 under `.output/` (DOC-Q104, `results-import-src.json`). `packages/astro/src/integration/index.ts:75` hardcodes `["./dist/**/client/**/*.map", "./dist/**/server/**/*.map"]` and never reads `outDir`, so builds with `outDir: ./dist-middleware` and `./dist-removed-option` kept 27 and 26 hidden maps and shipped them with the app (DOC-Q100, `results-build-middleware.json`, `results-build-removed-option.json`). The Nitro default is derived from the output directory and is not affected.

**Work item.** Scope the SolidStart glob to the build output, and read `outDir` for the Astro one.

''' + gs('solidstart','astro'))

t(XP, '`@sentry/elysia` on Node reports the Bun SDK name and a `bun` runtime', ['JavaScript','Bug'], 'Medium', '''
Elysia with `@elysiajs/node` on Node 26.5.0, initialized from `@sentry/elysia` as the guide prints it, sends every event and span with `sdk.name: sentry.javascript.bun` and `contexts.runtime: { name: "bun", version: "unknown" }`, in all eight variants of the run (DOC-Q66, `results-guide.json`). The init delegates to `@sentry/bun` on both runtimes, and `@sentry/elysia` applies its own SDK metadata before the Bun SDK stamps its. Issues and spans from Node deployments are filed against the wrong platform, and the runtime version is never reported.

**Work item.** Pick the base SDK and the reported metadata by runtime in `@sentry/elysia`. Same root as the Elysia on Deno ticket in the Deno milestone, and as JS-3582 and JS-3583.

''' + gs('elysia'))

t(XP, 'The Lambda `_HANDLER` shim wraps the handler again, so `wrapHandler` options never apply', ['JavaScript','Bug'], 'Medium', '''
`awsLambdaIntegration` rewrites `_HANDLER` to a shim that loads the user's export and passes it through `instrumentHandler`, which ends in `wrapHandler(patched)` with no options (`packages/aws-serverless/src/instrumentHandler.ts:53` and `:56`). Nothing checks whether the export is already a `wrapHandler` result, so the user's options sit inside a second wrapper that runs with defaults. With `Sentry.wrapHandler(handler, { flushTimeout: 1000, captureTimeoutWarning: false })` in the handler file a `Possible function timeout: qs-aws-lambda` warning event still arrived (DOC-Q73, `results-manual-esm-wrap-options.json`); `flushTimeout` and `timeoutWarningLimit` are unreachable the same way.

**Work item.** Mark handlers produced by `wrapHandler` and let the shim reuse the inner wrapper instead of adding a default outer one.

''' + gs('aws-lambda'))

t(XP, 'Google Cloud Functions: an HTTP invocation splits into two root spans, and the callback wrappers never end the function span', ['JavaScript','Bug'], 'Medium', '''
`wrapHttpFunction` calls `continueTrace` before `startSpanManual` (`packages/google-cloud-serverless/src/gcpfunction/http.ts:48-52`). With no incoming headers that starts a fresh trace, so every HTTP invocation produced two segments in two traces, `Serverless function execution` (`function.gcp`) and the framework's `http.server GET`, with the error linked to the function trace only; with `sentry-trace` and `baggage` present the two share a trace but stay siblings, never nested. The event and cloud-event wrappers do not call `continueTrace` and their span is a child of the `http.server` segment (DOC-Q70, `results-http-config.json`, `results-event-tracing.json`).

The callback wrappers have a second defect. For a three-parameter handler `wrapEventFunction` takes the callback branch (`packages/google-cloud-serverless/src/gcpfunction/events.ts:69-76`), where `span.end()` only runs inside the callback. A handler that throws synchronously is captured by `handleCallbackErrors` and rethrown, the callback never runs, and no `function.gcp` span is sent at all, which is the shape both config snippets print (`results-event-config.json`, `results-cloudevent-config.json`).

**Work item.** Start the function span first and continue the trace inside it; end the span on the error path of the callback wrappers.

''' + gs('gcp-functions'))

t(XP, 'Server segments keep a method-only name although the framework knows the route', ['JavaScript','Bug'], 'High', '''
Under the default stream lifecycle the segment span of a server request is named `GET` with source `url` on stacks whose own instrumentation holds the route pattern. TanStack Start names every segment `GET`, `/users/42` and `/api/sentry-example` included, with no `http.route`, and the server log carries `[Tracing] Ignoring name source on a child span: this attribute is only valid on the root span.` once per request: the request middleware renames a child rather than the segment. The SDK's own e2e test expects `GET /users/$userId` under `traceLifecycle: 'static'` (DOC-Q102, `results-nitro.json`).

Nuxt names static routes `GET` and gives a route name only to parameterized routes and to requests with a query string, because `packages/nuxt/src/runtime/hooks/updateRouteBeforeResponse.ts:27` sets the route only when `matchedRoutePath !== requestPath` (DOC-Q91, `results-plain.json`). SolidStart names every segment `GET` or `POST` with the path in `url.path` (DOC-Q106, `results-import-src.json`), the stream-lifecycle case of the SolidStart naming ticket in this milestone.

**Work item.** Rename the segment span, not the active child, in the TanStack Start request middleware, and drop the path-inequality guard in the Nuxt hook.

''' + gs('tanstackstart-react','nuxt','solidstart'))

t(CFG, 'Cloudflare Pages: the file route never reaches the segment span', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
Every Pages function route arrives as a segment named `GET` with source `url` and no `http.route`, the parameterized `functions/api/users/[id].js` included, so Pages file routes are invisible as routes (DOC-Q84, `results-base.json`). `sentryPagesPlugin` (`packages/cloudflare/src/pages-plugin.ts:78-93`) hands the request straight to `wrapRequestHandlerWithInit` and reads neither `context.params` nor the function path, which is the only place the route pattern exists.

**Work item.** Derive the route from the Pages function path and set it on the segment span, next to the Nuxt and SvelteKit renaming work in this milestone.

''' + gs('cloudflare-pages'))

t(XP, 'A server segment with no response keeps status ok', ['JavaScript','Bug'], 'Medium', '''
A request that never produced a response still ends its segment span as a success. A Connect request the client aborted arrived with `status: ok` and `http.response.status_code: 200` after 3 s although nothing had been written (DOC-Q53, `results-no-handler.json`). The SvelteKit segment of a throwing route is `ok` with no status code at all, and only the `sveltekit.resolve` child carries the 500 (DOC-Q94, `results-base.json`); the three throwing routes of the Cloudflare Pages run behave the same (DOC-Q84, `results-base.json`). Alerts and failure rates built on segment status miss every one of these.

**Work item.** Set the segment status from the response, and from the thrown error where there is no response, in the Node HTTP server span and in the SvelteKit and Cloudflare request wrappers.

''' + gs('connect','sveltekit','cloudflare-pages'))

t(XP, 'The `@sentry/nitro` peer range rejects every Nitro beta after `3.0.260415-beta`', ['JavaScript','Bug'], 'High', '''
`packages/nitro/package.json` peers `nitro: ">=3.0.0-0 <4.0.0 || 3.0.260311-beta || 3.0.260415-beta"`. npm lets a prerelease satisfy a comparator only when it carries the same `major.minor.patch`, so the range accepts exactly `3.0.0`, `3.0.260311-beta` and `3.0.260415-beta` and rejects every beta published since, the registry's `latest` included. `npm install` ends in `ERESOLVE` for a plain Nitro app (DOC-Q78, `results-latest-nitro.json`, which needed `--legacy-peer-deps`) and for `npm install @sentry/solidstart`, because SolidStart 2 pulls a newer beta (`results-import-src.json`). Two getting-started guides cannot be followed with npm as printed.

**Work item.** Widen the range so Nitro 3 prereleases resolve, and pin a recent beta in CI so it stays true.

''' + gs('nitro','solidstart'))

t(XP, '`@sentry/nitro`: `enableNitroErrorHandler` is untyped, and the dev server initializes the SDK twice', ['JavaScript','Bug'], 'Medium', '''
`packages/nitro/src/runtime/hooks/captureErrorHook.ts:38` reads `enableNitroErrorHandler` off the client options with an `in` check, and it works at runtime, but no shipped type declares it for a plain Nitro app: `@sentry/nuxt` carries it on `SentryNuxtServerOptions` (`packages/nuxt/src/common/types.ts:20`) and `@sentry/nitro` has no equivalent, so the TypeScript instrument file the guide prints gets an excess-property error (DOC-Q80, `results-no-error-handler.json`).

Under `nitro dev` with the documented `--import` flag the SDK initializes twice, in the main thread and in the worker, with 92 `Integration installed` lines, and every request sends two segments: a main-thread dev-proxy `GET` with source `url` and the worker's route-named one (`results-dev.json`).

**Work item.** Declare the option on the Nitro server options type, and skip the init in the dev proxy thread.

''' + gs('nitro'))

t(XP, 'Mastra: the built-in integration doubles tool spans, and the exporter marks non-streaming calls as streamed', ['JavaScript','Bug'], 'Low', '''
On the built-in `mastraIntegration` route one tool call produces two `gen_ai.execute_tool` spans, `execute_tool get-weather` under the agent span from Mastra's `client_tool_call` and `execute_tool weatherTool` under the chat span, so tool counts double (DOC-Q68, `results-sdk-only.json`). Mapping `client_tool_call` to `gen_ai.execute_tool` is the cause; the community exporter maps it to `ai.span` and does not double.

On the exporter route the `gen_ai.chat` span carries `gen_ai.request.stream: true` and `gen_ai.response.streaming: true` although both model calls went out with `stream=false` (`results-guide.json`). That half lives in `@mastra/sentry`, so it needs an upstream change or an override on our side.

**Work item.** Map `client_tool_call` to something other than `gen_ai.execute_tool` in `mastraIntegration`, and take the streaming flag from the request in the exporter.

''' + gs('mastra'))

t(XP, 'The injection diagnostics report a state the build is not in', ['JavaScript','Improvement'], 'Medium', '''
A user cannot tell from the SDK's own output whether instrumentation is active, and the output points both ways. A Remix server built with `sentryRemixVitePlugin`, whose SSR bundle holds ten `diagnostics_channel` injection sites, still logs `[Sentry] Runtime hook registered, injected libraries=[]` and `[Sentry] Bundler plugin did not run` at start-up (DOC-Q98, `results-vite-plugin.json`). Nuxt on Deno logs `Bundler plugin ran, injected libraries=[]` on a build that is instrumented, because that list is only filled during the build (DOC-F28). In the other direction, Koa on Deno prints `[instrumentation:koa] subscribing to channels` and `Integration installed: Koa` on a run where nothing Koa-specific is instrumented (DOC-F22), and Koa on Node prints `Integration installed: Koa` next to an `[instrumentation:koa] not injected yet` that never resolves (`results-self-import.json`).

**Work item.** Make one line at init state what actually happened, build-time injection and runtime injection separately, and stop reporting an integration as installed when its channels never bound. Next to the workerd warning ticket in the Cloudflare milestone and the silent-hook ticket in the Deno milestone.

''' + gs('remix','koa') + ' Also cell records M-nuxt-deno and M-koa-deno in the deep probe report.')

t(XP, '`SentryEffectMetricsLayer` fails to build on Effect v3', ['JavaScript','Bug'], 'High', '''
`packages/effect/src/metrics.ts:183-193` builds the layer with `Layer.effectDiscard` around `Effect.acquireRelease` and `Effect.forkScoped`, neither of which gets a scope from `effectDiscard`. On `effect@3.22.2` merging the layer fails with `Service not found: effect/Scope`, the program never runs and nothing is sent, so the option takes down the whole app rather than only its metrics; on `effect@4.0.0-rc.112` the same layer builds (DOC-Q75, `results-metrics.json` against `results-v4.json`). The guide prints the layer in its Effect v3 tab.

**Work item.** Give the layer a scope so it works on both majors, and run the Effect suite against v3 and v4 in CI.

''' + gs('effect'))

t(XP, '`@sentry/effect` captures no failed effect and turns the Node defaults off', ['JavaScript','Bug'], 'Medium', '''
Nothing in `packages/effect/src` calls `captureException`, `captureMessage` or `captureEvent`, so a failed effect is never reported: `yield* Effect.fail(new Error("Sentry Test Error"))`, the guide's own verify step, produced no error event in any variant that ran it (DOC-Q76, `results-issues.json`, `results-launch.json`, `results-v4.json`). `packages/effect/src/server/sdk.ts:17` sets `defaultIntegrations: options.defaultIntegrations ?? false`, so the global handlers that would otherwise catch the crash are off as well and only `SpanStreaming` is installed (DOC-Q77). The SDK's own e2e app captures failures by hand with `captureException(Cause.squash(cause))`.

**Work item.** Capture failed effects from the layer, and either keep the Node default integrations or say at init which ones were dropped.

''' + gs('effect'))

t(XP, 'React 19: the `reactErrorHandler` root hooks dedupe the ErrorBoundary event away', ['JavaScript','Bug'], 'Medium', '''
With `onCaughtError: Sentry.reactErrorHandler()` on the root and `Sentry.ErrorBoundary` around the tree, two APIs the SDK ships and the page wires together, the root hook captures first (`auto.function.react.error_handler`, `handled: false`) and the boundary's own event is dropped: five `Not capturing exception because it's already been captured.` lines in one run, and with them the `beforeCapture` tags and the linked component stack of `captureReactException`. On a plain `createRoot` the boundary path works as documented (DOC-Q13, `results-error-boundary.json` against `results-error-boundary-plain.json`).

`reactErrorHandler` also derives `handled` from whether a callback was passed, so `onUncaughtError: Sentry.reactErrorHandler(cb)` reports an error that unmounted the whole root as `handled: true`.

**Work item.** Let the boundary's richer event replace the root hook's, or skip the root hook for an error a Sentry boundary will report. Derive `handled` from the hook rather than from the callback.

''' + gs('react'))

t(XP, 'Svelte 5 runes-mode components get no update spans', ['JavaScript','Bug'], 'Low', '''
`trackUpdates` is implemented with `beforeUpdate` and `afterUpdate`, which throw in a Svelte 5 runes-mode component. The SDK swallows the throw and warns `Cannot track component updates. This is likely because you're using Svelte 5 in Runes mode.` only under `debug: true`, so a runes app with `trackUpdates: true` records the `ui.mount` span, no `ui.update` span ever, and nothing at the default log level says why; the legacy-mode component in the same run got its update spans (DOC-Q42, `results-track-component.json`). Runes are what a new Svelte 5 app is written in.

**Work item.** Track updates through a runes-compatible hook, or warn at the default log level and state the limit in the option's JSDoc.

''' + gs('svelte'))


# files
order=[BUN,DENO,CF,BUNG,DENOG,CFG,XP,BUNT,DENOT,CFT,DOCS]
T.sort(key=lambda x:(order.index(x['milestone'])))
idx=['# Linear ticket drafts','','Project: Improve Server Runtime + Framework Compatibility [JS]. Not created. Evidence links point at https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements.','','| # | Milestone | Title | Labels | Priority | File |','| --- | --- | --- | --- | --- | --- |']
for n,x in enumerate(T,1):
    slug=re.sub(r'[^a-z0-9]+','-',x['title'].lower()).strip('-')[:60]
    fn='%02d-%s.md' % (n, slug); x['file']=fn; x['n']=n
    open(os.path.join(OUT,fn),'w').write('# %s\n\nMilestone: %s\nLabels: %s\nPriority: %s\n\n%s\n' % (x['title'],x['milestone'],', '.join(x['labels']),x['priority'],x['body']))
    idx.append('| %d | %s | %s | %s | %s | `%s` |' % (n,x['milestone'],x['title'],', '.join(x['labels']),x['priority'],fn))
open(os.path.join(OUT,'README.md'),'w').write('\n'.join(idx)+'\n')
json.dump(T, open(os.path.join(OUT,'_tickets.json'),'w'), indent=1)
from collections import Counter
print(len(T),'tickets'); print(Counter(x['milestone'] for x in T))
