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
`@sentry/nextjs`, `@sentry/nuxt`, `@sentry/sveltekit`, `@sentry/astro`, `@sentry/react-router`, `@sentry/tanstackstart-react`, `@sentry/solidstart` and `@sentry/remix` initialize the Node SDK. On Bun 1.4.0, Bun never publishes `http.server.request.start` and Node's undici fetch channels never fire, so with the documented wiring route names, per-request isolation, incoming trace continuation and outgoing fetch spans are all absent. Errors and logs still arrive, so nothing looks broken.

Verified fix in every cell: install `@sentry/bun` next to the framework SDK and add `bunServerIntegration()` or `bunHttpServerIntegration()` (whichever server the framework uses) plus `fetchIntegration()` to the server init, gated on `typeof Bun !== "undefined"`. The repo's own e2e app `nextjs-16-bun` does this in `sentry.server.config.ts`.

**Work item.** Detect Bun in the framework server inits and add the two integrations there, so the documented wiring works unchanged. Until then, one shared docs snippet (DOC-B3 in the audit).

''' + cells('M-nextjs-bun','M-nuxt-bun','M-sveltekit-bun','M-astro-bun','M-reactrouter-bun','M-tanstack-bun','M-solidstart-bun','M-remix-bun'))

t(BUN, 'Hono on Bun: inlining `hono` in the Bun bundle drops route names and error capture', ['JavaScript','Bun','Bug'], 'Medium', '''
`bun app.ts` with `@sentry/hono/bun` gives `GET /user/:id` (source `route`) and the `auto.http.hono.context_error` event. A `Bun.build` with `sentryBunPlugin()` and `external: ["@sentry/*"]` keeps `@sentry/hono` external but inlines `hono`; the middleware patches then miss, transactions fall back to `GET /user/42` (source `url`) and no error is captured. Keeping `hono` external as well, or dropping `external` entirely, restores both.

**Work item.** Make the patch survive an inlined `hono`, or detect the split at init and warn with the fix.

''' + cells('M-hono-bun'))

t(BUN, 'NestJS on Bun: the documented `@sentry/nestjs` init loses route names, and the plugin build fails without Nest peers as externals', ['JavaScript','Bun','Bug'], 'Medium', '''
NestJS 11 boots on Bun 1.4.0 with a `tsconfig.json` that has `experimentalDecorators` and `emitDecoratorMetadata`. With `Sentry.init` from `@sentry/nestjs`, route names are lost on Bun; initializing from `@sentry/bun` and adding `nestIntegration()` from `@sentry/nestjs` restores them. Route names and the Express middleware and handler spans exist only in the bundled build; `bun src/main.ts` gives URL-named transactions and no child spans.

The `Bun.build` with `sentryBunPlugin()` fails with `Could not resolve: "@nestjs/microservices/microservices-module"` unless Nest's lazily required optional peers are listed as `external` (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`).

**Work item.** Make `@sentry/nestjs` init pick the Bun SDK on Bun, and have the plugin treat Nest's optional peers as external by default.

''' + cells('M-nestjs-bun'))

t(BUN, 'Remix on Bun: the request handler patch never runs when the server runtime is inlined', ['JavaScript','Bun','Bug'], 'Medium', '''
Plain `bun server.mjs` sends errors and logs only, no transactions and no spans. Bundling the server entry with `Bun.build({ plugins: [sentryBunPlugin()] })` and running `bun dist/server.js` gives route-named transactions, `LOADER routes/users.$id` children, database spans and outgoing fetch spans. Because the bundle inlines `@remix-run/server-runtime`, Sentry's `createRequestHandler` patch never runs, so per-request isolation and incoming trace continuation only work when the app wraps the adapter handler in `withIsolationScope` and `continueTrace` itself, or adds `bunHttpServerIntegration({ spans: false })`.

Two app-side traps: `"sideEffects": false` in the app's `package.json` makes `Bun.build` tree-shake the side-effect-only driver import, and `express` must go back on `external` after the plugin has run.

**Work item.** Apply the request handler patch to an inlined server runtime (the plugin can transform it), and warn when `sideEffects: false` drops an instrumented import.

''' + cells('M-remix-bun'))

t(BUN, 'React Router on Bun: the documented server entry depends on `renderToPipeableStream`, which Bun does not provide', ['JavaScript','Bun','Bug'], 'Medium', '''
Bun resolves `react-dom/server` to a build without `renderToPipeableStream`, so `createSentryHandleRequest({ renderToPipeableStream, ... })` from the guide cannot be used. The verified entry uses `renderToReadableStream` with `Sentry.wrapSentryHandleRequest(handler)` and `export const handleError = Sentry.createSentryHandleError({ logErrors: true })`. With that, the documented `instrumentations` export, and the Bun integrations from the umbrella ticket, all seven capabilities pass.

**Work item.** Ship a `renderToReadableStream` variant of `createSentryHandleRequest`, or name `wrapSentryHandleRequest` as the Bun path in the package docs.

''' + cells('M-reactrouter-bun'))

t(BUN, 'TanStack Start on Bun: Vite plugin order crashes the build, and parameterized route names are never produced', ['JavaScript','Bun','Bug'], 'Medium', '''
Unless `sentryTanstackStart()` is the first Vite plugin and `@sentry/*` stays external in the Nitro server build, `vite build` dies with `Cannot read properties of null (reading 'getVariableForExportName')`, because Nitro bundles the SDK. With that fixed and the Bun integrations added, errors, isolation, incoming trace, outgoing fetch and logs work under `bun --preload ./instrument.server.mjs .output/server/index.mjs`. Parameterized route names such as `GET /api/user/$id` are still not produced on Bun, and database spans need the diagnostics-channel pin from the Bun channel ticket.

**Work item.** Make the plugin robust to ordering or fail with a clear message, and find why the route patterns do not reach the server span on Bun.

''' + cells('M-tanstack-bun'))

t(BUN, 'Nuxt `bun` preset: the server init is never loaded because Bun ignores `NODE_OPTIONS`', ['JavaScript','Bun','Improvement'], 'Medium', '''
The documented start command loads `sentry.server.config.mjs` through `node --import`. Bun ignores `NODE_OPTIONS` and has no `--import` flag, so under `NITRO_PRESET=bun` and `bun .output/server/index.mjs` the SDK never initializes unless `sentry: { autoInjectServerSentry: "top-level-import" }` is set in `nuxt.config.ts`. With that and the Bun integrations, six of seven capabilities pass. Nitro bundling `mysql2` breaks every query with `genFunc$1 is not a function` regardless of Sentry; `nitro.externals.external: ["mysql2"]` avoids it.

**Work item.** Default `autoInjectServerSentry` to `top-level-import` when the Nitro preset is `bun`, or fail the build with the instruction.

''' + cells('M-nuxt-bun'))

t(DENO, 'Express, Hapi, Koa and NestJS on Deno: hook order and JSON-require failures per framework', ['JavaScript','Deno','Bug'], 'High', '''
With `import "@sentry/deno/import"` as the first line, Express and Hapi fail at import with `SyntaxError: Unexpected token ':'` and Koa with `Cannot resolve module "./index.js"`, because any module load hook makes Deno compile `require("*.json")` as JavaScript (denoland/deno#36240). Without the hook they run, but transactions are URL-named, there are no child spans and handler errors are not captured.

Verified shapes: a JSON load hook registered before the framework import restores route names for Hapi and NestJS; Koa needs the hook registered after its own import through `await import("@sentry/deno/import")` for driver spans; bundling with esbuild and `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` gives Hapi and Koa route names, framework spans and error capture with no runtime hook at all. NestJS with `@sentry/nestjs` alone gets everything except parameterized route names.

**Work item.** Once the JSON shim in the Deno milestone ships, re-run the four cells and remove the per-framework workarounds. Add real-library Deno scenarios for these four (JS-3523).

''' + cells('M-express-deno','M-hapi-deno','M-koa-deno','M-nestjs-deno'))

t(DENO, 'Fresh on Deno: errors swallowed, no route names, and the route Fresh sets is dropped for lack of a context manager', ['JavaScript','Deno','Bug'], 'High', '''
Three separate gaps. Fresh's `App.handler()` catches every route and middleware error and renders its own 500, so nothing reaches Sentry; `captureConsoleIntegration({ levels: ["error"] })` or an explicit capture in the app's error handler works. Spans stay unparameterized unless a middleware reads `ctx.route` and calls `updateSpanName` on the root span. Fresh itself sets `http.route` through `trace.getActiveSpan()` from `@opentelemetry/api`, which returns `undefined` because the Deno SDK registers a tracer provider but no context manager, so Fresh's own route enrichment is lost.

Database spans need every driver in both `ssr.external` and `environments.ssr.build.rollupOptions.external`, because `@fresh/plugin-vite` sets `resolve.noExternal: true`.

**Work item.** Register an OpenTelemetry context manager on Deno so framework-set attributes reach the active span, and consider a Fresh integration for errors and route names.

''' + cells('M-fresh-deno'))

t(DENO, 'Oak on Deno: `app.listen()` runs handlers outside the request context', ['JavaScript','Deno','Bug'], 'Medium', '''
Mounted with `app.listen()`, Oak handlers run outside the request's async context: `getActiveSpan()` is undefined, errors are never captured, and tags and trace ids leak between requests. Mounted with `Deno.serve(app.fetch)`, errors, isolation, incoming trace, database spans and logs work with no extra wiring. Route names need a `router.use()` middleware registered before the routes that renames the span from `ctx.matched?.at(-1)?.path` and sets the segment name source to `route`.

**Work item.** Decide whether the `app.listen()` path can be instrumented. At minimum, make the SDK warn when a request handler runs with no active span, and consider an Oak route-naming integration.

''' + cells('M-oak-deno'))

t(DENO, 'Elysia on Deno: `@sentry/elysia` init delegates to the Bun SDK and never instruments `Deno.serve`', ['JavaScript','Deno','Bug'], 'High', '''
With `Sentry.init` from `@sentry/elysia`, there is no `http.server` span on Deno, every request in the process shares one trace, incoming `sentry-trace` headers are ignored, and tags and request URLs bleed between concurrent requests, because that init delegates to `@sentry/bun`. Initializing from `@sentry/deno` before `Deno.serve` and importing only `withElysia` (plus `fetchIntegration` from `@sentry/elysia` for outgoing requests) makes errors, route names, isolation, incoming trace, outgoing fetch, database spans and logs work, at the cost of `sdk.name` reporting `sentry.javascript.deno`.

**Work item.** Pick the base SDK by runtime in `@sentry/elysia`. Same root as JS-3582 and JS-3583 on Node.

''' + cells('M-elysia-deno'))

t(DENO, 'Nuxt `deno_server` preset has no request instrumentation', ['JavaScript','Deno','Bug'], 'Medium', '''
With `nitro: { preset: "deno_server" }` and the documented wiring, there are no `http.server` spans, `getActiveSpan()` is undefined in handlers, every request shares one isolation scope and one trace id, and incoming trace headers are ignored. The default `node-server` output run under `deno run` works, with route names, incoming trace continuation and isolation, because Nitro's node-server entry uses `node:http`, which the Deno SDK instruments. Outgoing fetch needs `winterCGFetchIntegration()` from `@sentry/vercel-edge` on either preset (JS-3517).

**Work item.** Cover Nitro's `Deno.serve` entry in the `@sentry/nuxt` server side, or state the preset limit in the package and the docs.

''' + cells('M-nuxt-deno'))

t(DENO, 'Next.js on Deno fails every request unless runtime channel injection is off', ['JavaScript','Deno','Bug'], 'High', '''
Next.js 15 App Router builds and serves on Deno 2.9 with `deno run -A node_modules/next/dist/bin/next build` and `start`. With the default `Sentry.init`, every request returns 500 with `SyntaxError: Unexpected token ':'`, because the runtime channel hook makes `require("*.json")` fail (denoland/deno#36240). `enableRuntimeChannelInjection: false` fixes it; drivers with their own diagnostics channels (mysql2 3.11+, ioredis 5.11+) then get spans, hook-dependent drivers (mysql 2.x, pg) do not. Outgoing fetch needs `integrations: [winterCGFetchIntegration()]` from `@sentry/vercel-edge`, already a dependency of `@sentry/nextjs`.

**Work item.** Disable runtime channel injection automatically on Deno until the JSON shim lands, and add the WinterCG fetch integration to the Next.js server defaults when the runtime is Deno.

''' + cells('M-nextjs-deno'))

t(DENO, 'Deno leaks the AsyncLocalStorage store across requests after a dynamic import', ['JavaScript','Deno','Bug'], 'Medium', '''
Deno leaks the AsyncLocalStorage store out of a handler that awaits a dynamic `import()`. Node with the same build does not. Scope data set during one request (tags, user, contexts, breadcrumbs) appears on later requests. Fresh on Deno is confirmed broken, because its route chunks load lazily; Nuxt on the `deno_server` preset and SolidStart on Deno are partial. The app-level mitigation is to replace the isolation scope in a middleware before `ctx.next()`.

**Work item.** File the upstream Deno bug with the minimal reproduction from the Fresh cell, and evaluate an SDK-side guard: a fresh isolation scope per `Deno.serve` request that does not inherit a stale store.

''' + cells('M-fresh-deno','M-nuxt-deno','M-solidstart-deno'))

t(CF, 'No warning when a Worker is bundled without build-time instrumentation', ['JavaScript','Cloudflare Workers','Improvement'], 'High', '''
Express, Koa, Hapi and NestJS boot on workerd behind `enable_nodejs_http_server_modules` and `httpServerHandler` from `cloudflare:node`, and Fresh and Elysia run as plain fetch handlers. A Worker bundled by `wrangler dev` or `wrangler deploy` alone then emits no route names, no framework spans and no database spans, and logs nothing. Built with `sentryCloudflareVitePlugin()` from `@sentry/cloudflare/vite`, or with `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` for non-Vite builds, all of them arrive. On Bun the same situation prints a debug-level line (JS-3508); on Cloudflare there is nothing.

**Work item.** Detect at init on workerd that no channel injection happened and warn at the default log level, naming both plugins. Document `sentryOrchestrionPlugin`, which is exported from six entry points and documented nowhere.

''' + cells('M-express-cf','M-koa-cf','M-hapi-cf','M-nestjs-cf','M-fresh-cf','M-elysia-cf'))

t(CF, 'Koa on Workers: instrumented `use()` starts a span at startup, which workerd rejects', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
Creating the Koa app at module scope makes the Worker fail to start with `Disallowed operation called within global scope`, because the instrumented `app.use()` starts a span outside any request. The app, every `use()`, the router wiring and `app.listen()` must run inside the fetch handler behind a memoized promise; `httpServerHandler({ port })` may stay at module scope. With that and the Vite plugin build, all seven capabilities pass, including `auto.middleware.koa` errors and `http.route`.

**Work item.** Make the Koa `use` instrumentation record nothing when there is no active request or isolation scope, so module-scope construction works on workerd.

''' + cells('M-koa-cf'))

t(CF, 'Hapi on Workers: an early `close` turns every response into a 499 and the error event never fires', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
On workerd the response emits `close` before `finish` with `writableEnded` still false. Hapi reads that as a client disconnect, answers 499, and its `request` and `error` events never fire, so `hapiIntegration` captures nothing. An app-side `onRequest` extension that drops the premature `close` before Hapi's transmit sees it restores capture, the transaction name and the `auto.function.hapi` mechanism. Route names, isolation, incoming trace, outgoing fetch, database spans and logs work with build-time instrumentation.

**Work item.** Handle the early `close` inside `hapiIntegration` or the Cloudflare HTTP server shim, so Hapi on workerd needs no app-side extension.

''' + cells('M-hapi-cf'))

t(CF, 'SvelteKit on Workers: the segment span keeps the URL and never gets the route id', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
Unlike the Node SvelteKit SDK, the transaction or segment span on Workers is named by the Cloudflare request handler and keeps the raw URL: `GET /users/42` with source `url` under the static lifecycle, bare `GET` under the default stream lifecycle. The SvelteKit route id and `http.route` only reach a child span. A user-land `handle` inserted between `initCloudflareSentryHandle` and `sentryHandle` that renames the root span with `getActiveSpan` and `getRootSpan` from `@sentry/sveltekit` fixes it in both lifecycles.

Database spans come from the transform `sentrySvelteKit()` already installs, but on a flat `node_modules` (npm or Yarn) they are missing until `ssr: { noExternal: [/^@sentry\\//] }` is added; pnpm needs nothing.

**Work item.** Have `sentryHandle` rename the root span from `event.route.id` on Cloudflare, and look at why the flat install needs `noExternal`.

''' + cells('M-sveltekit-cf'))

t(CF, 'Nuxt on Workers: parameterless routes are named by method only', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
With the documented `sentryCloudflareNitroPlugin` wiring, six of seven capabilities pass. Only routes with parameters, such as `/api/users/[id]`, get their route pattern; a parameterless route such as `/api/health` is reported as bare `GET` under the stream lifecycle and as the request URL under static. A second Nitro plugin that renames the root span from `event.context.matchedRoute` with `getActiveSpan`, `getRootSpan` and `spanToJSON` produced identical output to a patched SDK.

**Work item.** Rename the root span from the matched Nitro route inside `sentryCloudflareNitroPlugin`.

''' + cells('M-nuxt-cf'))

t(CF, 'Remix on Workers: the bare `@sentry/remix` import captures nothing in a webworker SSR build', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
In a Remix Vite build with `ssr.target: "webworker"`, `import * as Sentry from "@sentry/remix"` resolves to the browser build, `handleError` ends up undefined, and no error is captured, with only a rollup warning. The same code imported from `@sentry/remix/cloudflare` captures loader, action and resource-route errors and thrown 5xx responses on both lifecycles. Per-request isolation needs `withSentry` from `@sentry/cloudflare` around a handler built with `instrumentBuild`; `wrapRequestHandler` from the `/request` entry does not establish isolation on Workers unless the async-context strategy is set first (separate ticket). Database spans need `sentryCloudflareVitePlugin()` in the Vite config; without it, queries run, no span appears, and nothing warns.

**Work item.** Make the bare import fail loudly in a webworker build, or resolve it to the Cloudflare entry through the export conditions.

''' + cells('M-remix-cf'))

t(CF, 'Next.js via OpenNext: outgoing fetch is uninstrumented without the Cloudflare fetch integration', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
With the documented OpenNext wiring, errors, route names, isolation, incoming trace and logs pass. Outgoing `fetch` and `node:http` requests produce no `http.client` span and carry no `sentry-trace` or `baggage` header, because the Workers runtime provides a native fetch that the Node HTTP instrumentation never sees. Installing `@sentry/cloudflare` explicitly (it is not a transitive dependency of `@sentry/nextjs`) and adding `fetchIntegration()` from it to `sentry.server.config.ts` restores both. mysql2 needs `disableEval: true` or `pool.query` throws `EvalError: Code generation from strings disallowed`.

**Work item.** Add the Cloudflare fetch integration to the Next.js server defaults when the runtime is workerd.

''' + cells('M-nextjs-cf'))

t(CF, 'SolidStart on Workers: no server-side code path and no server-to-client trace', ['JavaScript','Cloudflare Workers','Feature'], 'Medium', '''
`@sentry/solidstart` has no Cloudflare export; its server entry initializes the Node SDK. The verified shape keeps `@sentry/solidstart` for the browser and wraps the built Nitro handler with `withSentry` from `@sentry/cloudflare` in a hand-written `worker.mjs`, with `@sentry/cloudflare` kept external through `server.rollupConfig` so Nitro does not inline a second copy. Server errors need a Nitro plugin that forwards the `error` hook to `captureException`. Route names come from the raw URL, and nothing injects a `sentry-trace` meta tag into the SSR HTML, so there is no server-to-client continuation. Database spans were not exercised.

**Work item.** A `@sentry/solidstart/cloudflare` path: init from the Cloudflare SDK, the error hook, and the meta tags. Or a documented limit.

''' + cells('M-solidstart-cf'))

t(CF, 'Fresh on Workers: the Sentry Vite plugin breaks the driver when no worker environment exists', ['JavaScript','Cloudflare Workers','Bug'], 'Low', '''
Fresh's own Vite plugin emits `_fresh/server.js` whose default export is already a fetch handler, so it runs on Workers with no adapter. Putting `sentryCloudflareVitePlugin()` into Fresh's `vite.config.ts` breaks the database driver under workerd, because there is no Cloudflare worker environment for the plugin to instrument. The working shape keeps the SDK and the driver external to the SSR build and bundles the wrangler entry separately with the orchestrion esbuild plugin. Errors are swallowed by Fresh's default handler and spans are named by method only, as on the other runtimes.

**Work item.** Make the Cloudflare Vite plugin a no-op with a warning when the Vite config has no worker environment.

''' + cells('M-fresh-cf'))

t(CF, 'Decision: Fastify does not run on Cloudflare Workers', ['JavaScript','Cloudflare Workers','Task'], 'Low', '''
Fastify 5.12.3 behind `httpServerHandler` with `nodejs_compat` and `enable_nodejs_http_server_modules`: constructing the app at module scope throws `Disallowed operation called within global scope`, because Fastify's boot generates random values and schedules work. Constructing it lazily on the first request then fails when any route is registered, because the router compiles matchers with `new Function` and Workers forbid runtime code generation, with no compatibility flag that lifts it. Fastify 4 behaves the same. A plain `node:http` server behind the same config serves requests, so the Cloudflare half is fine. No Sentry capability could be exercised.

**Work item.** Record the decision and state it in the Cloudflare and Fastify docs (audit DOC-F38). No SDK work.

''' + cells('M-fastify-cf'))

t(BUNG, 'Bun garbage-collects the diagnostics channels the SDK subscribes to', ['JavaScript','Bun','Bug'], 'High', '''
Bun's `node:diagnostics_channel` holds channels weakly and collects a channel together with its subscribers when nothing keeps a strong reference. The SDK drops the channel object it subscribes to (`packages/server-utils/src/tracing-channel.ts:200-208`), so an instrumented module that first evaluates inside a request, such as mysql's lazily required `lib/Connection.js` or a driver imported dynamically in a handler, never gets spans. Reproduced on develop and 10.73.0, bun 1.4.0 and 1.3.14, and in the database-span cells of six framework SDKs on Bun. Node keeps subscribed channels alive.

Workarounds: import drivers and create pools at module scope, or pin the channels after `Sentry.init()` with `dc.tracingChannel(name)` held on `globalThis`.

**Work item.** Retain the channel references in the SDK. File the Bun report with the minimal probe.

''' + probes('X02','B17'))

t(DENOG, 'Ship a JSON load-hook shim for the module hook', ['JavaScript','Deno','Bug'], 'High', '''
Registering any `Module.registerHooks` load hook on Deno 2.9 makes CommonJS `require("*.json")` compile as JavaScript (denoland/deno#36240, fix in denoland/deno#36243, both open). Under `@sentry/deno/import` that breaks Express, Hapi, Fastify, mysql2, Koa's dependencies and NestJS at import with `SyntaxError: Unexpected token ':'`. A second load hook that delegates and sets `format: "json"` for `.json` URLs works around it, verified with the hook on and off.

**Work item.** Register that shim in `register.ts` until the Deno fix ships, with a version check to drop it afterwards.

''' + probes('D-JSON','X03'))

t(DENOG, '`denoCronIntegration` crashes `init` on Deno 2.9, and its JSDoc claims a default it is not', ['JavaScript','Deno','Bug'], 'High', '''
`packages/deno/src/integrations/deno-cron.ts:23` assigns `Deno.cron = new Proxy(Deno.cron, ...)`. On Deno 2.9.0 `Deno.cron` is a getter-only property, so `Sentry.init` with this integration throws `TypeError: Cannot set property cron of #<Object> which has only a getter`. It works on 2.8.3, the CI pin. Line 18 returns silently when `Deno.cron` is absent, so without `--unstable-cron` the integration does nothing. The JSDoc at line 64 says "Enabled by default", but the integration is not in the default set at `packages/deno/src/sdk.ts:31-49`.

**Work item.** Define the proxy with `Object.defineProperty`, add Deno 2.9 to CI (JS-3524), fix the JSDoc.

''' + probes('D11'))

t(DENOG, 'The import hook is silent when it transforms nothing', ['JavaScript','Deno','Improvement'], 'Medium', '''
Three cases end with no instrumentation and no message. The hook only transforms packages under a local `node_modules`; from Deno's npm cache nothing is injected. Without `--allow-env` the first-line import crashes with `NotCapable: Requires env access`, and a scoped `--allow-env=...` is not enough. The `--import=@sentry/deno/import` form shown in the package README is resolved as a file path and rejected; only the first-line import or `--import=./node_modules/@sentry/deno/build/import.mjs` registers the hook. `init()` itself never warns when the hook is absent (#23892).

**Work item.** One diagnostic path: warn at init when no injection happened, say why when it can be known (no local `node_modules`, hook not registered), and accept the bare specifier or fix the README.

''' + probes('D02','D-HOOK'))

t(DENOG, 'Events report the package as `denoland:sentry`', ['JavaScript','Deno','Bug'], 'Low', '''
`packages/deno/src/client.ts:36` sets `sdk.packages[0].name` to `denoland:sentry`, while the package ships on npm only and every documented install uses `npm:@sentry/deno`.

**Work item.** Report `npm:@sentry/deno`, matching the other SDKs.

''' + probes('D02'))

t(CFG, 'Errors inside `ctx.waitUntil()` are never captured', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
An error thrown or a promise rejected inside `ctx.waitUntil(promise)` is never captured, on both trace lifecycles and on develop and 10.73.0. The SDK's `waitUntil` handling in `packages/cloudflare/src/flush.ts` and `packages/cloudflare/src/client.ts:280-295` is flush and invocation bookkeeping; no error-capture path is attached. `ctx.waitUntil(work().catch(e => Sentry.captureException(e)))` is the app-side shape.

**Work item.** Wrap the promise handed to `waitUntil` so a rejection is captured once, then rethrown.

''' + probes('C01'))

t(CFG, 'Dedupe drops repeated errors across requests with the cached client', ['JavaScript','Cloudflare Workers','Bug'], 'Medium', '''
On develop the client is cached per isolate. The Dedupe integration then treats an identical error thrown in a later request as a duplicate: hitting the same failing route twice sends one event, and the second arrives only after a different event goes out. `enableDedupe: false` turns it off. On 10.73.0, with a client per request, every hit produced an event.

**Work item.** Reset the dedupe state per request, or leave Dedupe out of the Cloudflare defaults when the client is cached.

''' + '**Evidence.** Cloudflare section of the [deep probe report](' + REPORT + ') (develop regression) and the [quick start verification](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/quick-starts.html).')

t(CFG, 'The `/request` entry runs without an async-context strategy under the stream lifecycle', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
`wrapRequestHandler` from `@sentry/cloudflare/request` sets up a reduced client with no async-context strategy. Under the default stream lifecycle some requests turn into legacy transaction envelopes and events are dropped; `traceLifecycle: "static"` avoids it. On Workers with `nodejs_compat`, Remix wired through this entry loses per-request isolation unless `setAsyncLocalStorageAsyncContextStrategy` is called first.

**Work item.** Set the strategy in the request entry whenever AsyncLocalStorage is available, and otherwise force the static lifecycle there with a warning.

''' + cells('M-remix-cf') + ' Also the Cloudflare section of the deep probe report.')

t(XP, 'SolidStart names transactions by URL and swallows API-route errors on every runtime', ['JavaScript','Bug'], 'Medium', '''
SolidStart mounts the whole app as one Nitro catch-all handler, so the SDK's Nitro route parameterization never fires: server transactions arrive as `GET /users/456` with source `url` on Node, Bun, Deno and Workers. Errors thrown in a file API route (`src/routes/api/*.ts`) or during page render are turned into a 500 by SolidStart's internal h3 app before Nitro's error hook, so no event is sent, and the guide's own verification snippet produces nothing. Only `withServerActionInstrumentation`, or a user h3 middleware registered first in the array form of `createMiddleware`, captures them.

**Work item.** A SolidStart middleware in `@sentry/solidstart` that names the span from the route manifest and captures API-route errors.

''' + cells('M-solidstart-bun','M-solidstart-deno','M-solidstart-cf'))

t(XP, 'Package READMEs show wiring that does not resolve', ['JavaScript','Task'], 'Low', '''
`packages/deno/README.md:70` and `src/import.mjs:10` show `--import=@sentry/deno/import`, which Deno resolves as a file path and rejects. `packages/cloudflare/README.md:82-99` imports `wrapRequestHandler` from the main entry, which develop no longer exports (`ERR_PACKAGE_PATH_NOT_EXPORTED`); it lives on `@sentry/cloudflare/request`.

**Work item.** Fix both READMEs in one PR.

''' + probes('D-HOOK','CF-EXPORTS'))

t(BUNT, 'Add e2e apps for the verified Bun framework cells', ['JavaScript','Bun','Tests'], 'Medium', '''
Bun has e2e apps for Elysia, Next.js and mysql, and integration suites for Hono and two drivers. No Bun app runs Express, Koa, Hapi, Fastify, Oak, Fresh, NestJS, Remix, SolidStart, SvelteKit, Astro, React Router, TanStack Start or Nuxt, although all fourteen were verified to work with the wiring in the cell records. Each cell in the reproduction folder is a runnable app with a README that lists install, run and expected output.

**Work item.** Port the cells into `dev-packages/e2e-tests/test-applications/`, one per framework, starting with the four Node HTTP frameworks on the plugin build.

''' + '**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-bun` directories), and the framework grid in the [deep probe report](%s).' % REPORT)

t(DENOT, 'Add e2e apps for the verified Deno framework cells', ['JavaScript','Deno','Tests'], 'Medium', '''
Only `hono-4 (deno)` runs a real framework on Deno in CI; the Deno orchestrion suites publish channels by hand (JS-3523). Sixteen framework cells were verified on Deno 2.9, with the wiring in their records. Fastify works with no hook, Next.js, Nuxt (node-server output), SvelteKit and Astro work with one integration added, and the rest need the JSON hook or the esbuild build.

**Work item.** Port the cells into e2e apps, starting with Fastify, Next.js, Nuxt, SvelteKit and Astro, and add Deno 2.9 to the runner (JS-3524).

''' + '**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-deno` directories), and the framework grid in the [deep probe report](%s).' % REPORT)

t(CFT, 'Make the Cloudflare framework e2e apps required and add the missing ones', ['JavaScript','Cloudflare Workers','Tests'], 'Medium', '''
`react-router-8-cloudflare`, `tanstackstart-react-cloudflare` and `sveltekit-3-cloudflare-workers` are `optional` in CI (`.github/workflows/build.yml:1131`), so the wiring the Cloudflare framework pages describe does not run on pull requests. No app covers Express, Koa, Hapi or NestJS behind `httpServerHandler` with the Vite plugin, Elysia with `aot: false`, Oak, Fresh, Remix through `@sentry/remix/cloudflare`, or SolidStart.

**Work item.** Promote the three apps to required and port the nine missing cells.

''' + '**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-cf` directories), and the framework grid in the [deep probe report](%s).' % REPORT)

for rt, ids in [('Bun', 'DOC-B1, DOC-B2, DOC-B3, DOC-B4, DOC-R1 (Bun include), DOC-R8, DOC-R11, DOC-R12, DOC-F1 to DOC-F17'), ('Deno', 'DOC-D1 to DOC-D6, DOC-R2, DOC-R5, DOC-R6, DOC-R7, DOC-R8, DOC-R11, DOC-R17, DOC-F18 to DOC-F34'), ('Cloudflare', 'DOC-C6, DOC-C7, DOC-C8, DOC-R4, DOC-R7, DOC-R10, DOC-R11, DOC-R13 to DOC-R16, DOC-R18, DOC-R19, DOC-F35 to DOC-F51')]:
    t(DOCS, 'Track the %s docs issues from the runtime docs audit' % rt, ['JavaScript','Task'], 'Medium', '''
Tracking ticket for the `getsentry/sentry-docs` issues that come out of the runtime docs audit for %s. Items: %s. The v11-gated Cloudflare items (DOC-C1 to DOC-C5), X2 and DOC-R20 are owned by the Major Release 11.0 project and are not listed here.

**Work item.** Link each GitHub issue as it is filed; close when the last one is merged.

**Evidence.** [Docs audit](%s) with the proposed issue text per item
''' % (rt, ids, AUDIT))

def qs(*rts):
    return '**Evidence.** Getting-started reproduction%s %s, run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.' % ('s' if len(rts)>1 else '', ', '.join('[`quickstarts/%s/`](%s/quickstarts/%s)' % (r, REPRO, r) for r in rts))

t(CFG, 'Cloudflare Vite plugin: silent no-op without `wranglerConfigPath`, silent fallback without the options file', ['JavaScript','Cloudflare Workers','Bug'], 'High', '''
Two silent paths in `sentryCloudflareVitePlugin()`. With a wrangler config that is not at the default path and no `wranglerConfigPath`, the plugin instruments nothing: the build succeeds, the Worker runs without the SDK, the sink stays empty, and no warning is printed. With `autoInstrumentation` wrapping an entry that has no `withSentry`, the options callback is read from an `instrument.server.{ts,js,mjs,cjs}` file next to the wrangler `main`; without that file the callback is `() => undefined` and the Worker runs with no DSN, again silently. With both in place the built Worker delivered the same errors, spans, headers and logs as a hand-written `withSentry`.

**Work item.** Fail the build, or at least warn, when no wrangler config is found and when the entry is wrapped without an options file. Document the options file (docs item DOC-Q2).

''' + qs('cloudflare'))

t(CFG, 'Cloudflare segment span reports status ok on a 500 response', ['JavaScript','Cloudflare Workers','Spans','Bug'], 'Medium', '''
A `withSentry` route that throws answers 500 through wrangler, and the error event arrives with mechanism `auto.http.cloudflare`, but the segment span of that request is emitted with `status: "ok"`. Node, Bun and Deno mark the same route `internal_error`.

**Work item.** Set the span status from the thrown error in the Cloudflare request wrapper, the way the other runtimes do.

''' + qs('cloudflare'))

t(DENOG, 'The Deno import hook requires `--allow-env` at module load through the vendored debug package', ['JavaScript','Deno','Bug'], 'Medium', '''
With `import "@sentry/deno/import"` as the first line and the permission flags the Deno guide shows (`--allow-net`, `--allow-read`), the process exits before the app starts: `NotCapable: Requires env access, run again with the --allow-env flag`, raised from `node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124` reading `process.env` at module load. A scoped `--allow-env=SENTRY_DSN` is not enough. Without the hook line the same flags run, and the SDK silently drops `server_name`, the OS version, context lines and `app://` frame paths.

**Work item.** Guard the environment reads in the vendored `debug` (or read them lazily) so the hook loads under a scoped or missing `--allow-env`, and warn once instead of degrading silently when a permission is missing.

''' + qs('deno'))

t(XP, 'Error events on Bun and Cloudflare carry no `transaction` field', ['JavaScript','Bun','Cloudflare Workers','Bug'], 'Medium', '''
The same throwing route produces an error event with `transaction: "GET /debug-sentry"` on Node and no `transaction` key at all on Bun (`Bun.serve`, even with a `routes` map that names the server span `GET /users/:id`) and on Cloudflare (`withSentry`). Deno sets none either. Issues from those runtimes have no transaction to group or filter by.

**Work item.** Set `event.transaction` from the active segment span name in the Bun, Deno and Cloudflare request wrappers, as the Node request integration does.

''' + qs('node','bun','deno','cloudflare'))

t(XP, '`debug: true` prints no SDK name, version or runtime on any runtime', ['JavaScript','Improvement'], 'Low', '''
With `debug: true`, Node prints `Initializing Sentry: process: <pid>, thread: main.` and the list of installed integrations; Bun prints the same banner; Deno and Cloudflare print no banner at all. None of the four prints the SDK name, the SDK version, or the runtime name and version. In every reproduction those had to be read off the envelopes. A support thread that starts with "enable debug and paste the output" gets no identity line.

**Work item.** Print one line at init with SDK name, version, runtime name and version, on every runtime.

''' + qs('node','bun','deno','cloudflare'))

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
