# verify4-M-hapi-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-hapi-cf` (see `$REPRO/cells/M-hapi-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RESULTS-run2.txt`, `RESULTS.txt`, `build-esbuild.mjs`, `build-esbuild2.mjs`, `build-esbuild3.mjs`, `dcprobe/`, `devA.log`, `devA.pid`, `devB.log`, `devB.pid`, `devC.log`, `devC.pid`, `devD.log`, `devD.pid`, `devE.log`, `devE.pid`, `devF.log`, `devF.pid`, `devG.log`, `devG.pid`, `devH.log`, `devH.pid`, `devH2.log`, `devH2.pid`, `devH3.log`, `devH3.pid`, `devI.log`, `devI.pid`, `package-lock.json`, `package.json`, `run2/`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`, `vite.config.mjs`, `vite.config.run2.mjs`, `wr2-eager.jsonc`, `wr2-manual-stream.jsonc`, `wr2-manual.jsonc`, `wr2-orch-eager.jsonc`, `wr2-orch.jsonc`, `wr2-vite.jsonc`, `wrangler.custombuild.jsonc`, `wrangler.esbuild.jsonc`, `wrangler.esbuild2.jsonc`, `wrangler.esbuild3.jsonc`, `wrangler.jsonc`, `wrangler.lazy.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

The reported claim is half right and half too narrow. Confirmed: with no build-time instrumentation the transaction is the raw path. Refuted: Vite is NOT required, and route names are reachable in a plain wrangler build with ~4 lines of user code.

Probe dir: $SCRATCH/deep/verify4-M-hapi-cf-routenames (entries in run2/, results in RESULTS-run2.txt and RESULTS.txt; node_modules removed, restore with `npm install` — package.json points at the $S/pack tarballs). Sink on 53911, worker on 53912/53913, workerd via wrangler 4.129.0, compatibility_date 2026-05-01, flags nodejs_compat + enable_nodejs_http_server_modules, traceLifecycle static unless noted.

A) plain wrangler, module-scope routes, no plugin — `npx wrangler dev --config wr2-eager.jsonc --port 53912 --inspector-port 0`
   transaction | GET /ok                 | source= url | spans= []
   transaction | GET /users/42           | source= url | spans= []
   transaction | GET /posts/9/comments/3 | source= url | spans= []

A2) same build, a /probe handler logging Sentry.getActiveSpan() from inside the Hapi handler:
   PROBE {"hasActive":true,"activeJson":{"name":"GET /probe", ... "sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","sentry.segment.name.source":"url", ...}}
   The Cloudflare request span is the active span inside Hapi handlers and exts — AsyncLocalStorage survives the node:http server shim — so user code can rename it. This is the key fact the earlier probe missed.

B) same plain wrangler build, plus one onPreResponse ext (wr2-manual.jsonc):
   transaction | GET /ok                        | source= route | spans= []
   transaction | GET /users/{id}                 | source= route | spans= []
   transaction | GET /posts/{pid}/comments/{cid} | source= route | spans= []
B2) identical result on the develop default traceLifecycle 'stream' (wr2-manual-stream.jsonc):
   span | ["http.server GET /ok"]
   span | ["http.server GET /users/{id}"]
   span | ["http.server GET /posts/{pid}/comments/{cid}"]

C) no Vite, automatic naming: esbuild + `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild`, driven by wrangler's own `build.command` (run2/build-orch.mjs, wr2-orch.jsonc), so it is still a single `npx wrangler dev`:
   transaction | GET /users/{id}                 | source= route | spans= ["router GET /users/{id}"]
   transaction | GET /posts/{pid}/comments/{cid} | source= route | spans= ["router GET /posts/{pid}/comments/{cid}"]

D) documented wiring reproduced first-hand — `npx vite build --config vite.config.run2.mjs` then `npx wrangler dev --config dist-vite2/v4b_hapi_vite/wrangler.json`:
   transaction | GET /users/{id} | source= route | spans= ["router GET /users/{id}"]

E) the residual defect behind the "routes must not be at module scope" caveat, re-confirmed (wr2-orch-eager.jsonc, module-scope server.route() with build-time instrumentation):
   service core:user:v4b-hapi-orch-eager: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
     at worker.js:60489:38 in route
     at worker.js:81183:10 in registerRoutes
   Cause is visible in the generated bundle (dist-run2e/worker.mjs:59547):
     var tr_ch_apm_hasSubscribers = (ch) => ch.start.hasSubscribers || ch.end.hasSubscribers || ch.asyncStart.hasSubscribers || ch.asyncEnd.hasSubscribers || ch.error.hasSubscribers;
   workerd exposes Channel.hasSubscribers as a method, not the boolean getter Node.js specifies, so the guard is always truthy and every instrumented call enters runStores() even with zero subscribers. Both bundler paths (Vite and esbuild) inherit this, so both force route registration and server.start() into the first fetch. The manual rename in (B) has no such constraint — module-scope Hapi setup is fine there.

Why still "partial": automatic route naming needs build-time instrumentation, and a plain wrangler/esbuild deploy without a Sentry bundler plugin never gets it — @sentry/cloudflare names the request span from the URL and knows nothing about Hapi's router. Reference check: the repo has no Hapi-on-Cloudflare e2e app; the only build-time-instrumentation CF app, dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql, uses `cloudflare()` + `sentryCloudflareVitePlugin()` in vite.config.ts, i.e. the Vite path only.

## Workaround

Two, both verified. (1) No bundler plugin at all — keep the plain `wrangler dev`/deploy and module-scope routes, and rename the request span from a Hapi ext (run2/routes.mjs):

  server.ext('onPreResponse', (request, h) => {
    const active = Sentry.getActiveSpan();
    const root = active ? Sentry.getRootSpan(active) : undefined;
    if (root && request.route?.path) {
      Sentry.updateSpanName(root, `${request.method.toUpperCase()} ${request.route.path}`);
      root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
    }
    return h.continue;
  });

`request.route.path` is Hapi's parameterized pattern, so the name stays low cardinality. `updateSpanName` alone would set the source to `custom`; the extra `SENTRY_SEGMENT_NAME_SOURCE` attribute (exported from @sentry/cloudflare) makes it `route`. Works on both traceLifecycle values. It gives no `router` child span.

(2) Automatic naming without Vite — pre-bundle with esbuild and `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild` (bundle:true, format:'esm', platform:'node', external:['cloudflare:*'], plus a `createRequire` banner), and hang that build off wrangler's `build.command` so `npx wrangler dev`/`wrangler deploy` stays the only command. This yields `GET /users/{id}` with source=route plus a `router GET /users/{id}` child span, identical to the Vite build. With either bundler plugin, `server.route(...)` and `server.start()` must be deferred into the first fetch, otherwise the isolate fails to boot.

## Docs impact

On Cloudflare Workers, a Node HTTP framework such as Hapi behind `httpServerHandler` only gets parameterized transaction names (`GET /users/{id}`, source `route`) when the Worker is bundled with build-time instrumentation — either `sentryCloudflareVitePlugin` or `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild` wired into `wrangler`'s `build.command`; a plain `wrangler` build names the span from the URL, and you can fix that yourself by renaming the active root span from a `server.ext('onPreResponse')` hook with `Sentry.updateSpanName(root, \`${request.method.toUpperCase()} ${request.route.path}\`)` plus `root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route')`. When build-time instrumentation is on, register routes and call `server.start()` inside the first `fetch`, never at module scope, or the isolate fails to boot with "Disallowed operation called within global scope".
