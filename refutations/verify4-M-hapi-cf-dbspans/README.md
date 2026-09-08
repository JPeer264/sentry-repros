# verify4-M-hapi-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-hapi-cf` (see `$REPRO/cells/M-hapi-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `build-esbuild.mjs`, `build-esbuild2.mjs`, `build-esbuild3.mjs`, `build-esbuild4.mjs`, `build-esbuild5.mjs`, `build.mjs`, `dev-esbuild.log`, `dev.pid`, `devA.log`, `devA.pid`, `devB.log`, `devB.pid`, `devC.log`, `devC.pid`, `devD.log`, `devD.pid`, `devE.log`, `devE.pid`, `devF.log`, `devF.pid`, `devG.log`, `devG.pid`, `devH.log`, `devH.pid`, `devI.log`, `devI.pid`, `devJ.log`, `devJ.pid`, `devK.log`, `devK.pid`, `package-lock.json`, `package.json`, `run-b/`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`, `vite.config.mjs`, `wrangler.esbuild.jsonc`, `wrangler.esbuild2.jsonc`, `wrangler.esbuild3.jsonc`, `wrangler.esbuild4.jsonc`, `wrangler.esbuild5.jsonc`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED: db spans on Hapi + Cloudflare Workers do NOT need the Cloudflare Vite plugin. The real requirement is build-time orchestrion instrumentation from ANY of the SDK's bundler plugins. `@sentry/server-utils` ships `./orchestrion/{vite,rollup,esbuild,webpack,webpack-loader,bun}`; `@sentry/cloudflare/vite` is just `sentryOrchestrionPlugin` (vite) + the auto-instrument plugin. Pre-bundling the Worker yourself with esbuild + `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild`, then pointing wrangler at that bundle, gives the same db spans with no vite and no @cloudflare/vite-plugin installed.

Exact change (probe at $REPRO/refutations/verify4-M-hapi-cf-dbspans/run-b/):
  build.mjs:
    import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';
    esbuild.build({ entryPoints:['./src/index.mjs'], outfile:'./dist/worker.mjs', bundle:true,
      format:'esm', platform:'node', target:'es2022', external:['cloudflare:*'],
      banner:{ js: <require shim, see below> }, plugins:[forceEsmServerUtils, sentryOrchestrionPlugin()] })
  wrangler.jsonc: { "main": "dist/worker.mjs", "compatibility_date": "2026-05-01",
    "compatibility_flags": ["nodejs_compat","enable_nodejs_http_server_modules"] }
  Run: node build.mjs && npx wrangler dev --port 43231 --inspector-port 0

WITH the esbuild orchestrion plugin (sink /__items, traceLifecycle 'static', mysql@2 module-scope pool, query inside the Hapi handler):
  {"type":"transaction","name":"GET /db/{id}","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.cloudflare","spans":["router GET /db/{id}","db SELECT id, name FROM users"]}
  {"type":"transaction","name":"GET /ok","op":"http.server","source":"route","spans":["router GET /ok"]}
Control, IDENTICAL bundle minus the plugin (`node build.mjs --no-orchestrion`, dist-plain/worker.mjs):
  {"t":"transaction","n":"GET /db/7","src":"url","spans":[]}
  {"t":"transaction","n":"GET /sentinel","src":"url","spans":[]}
So the plugin, not the banner shim or the entry shape, is what produces the span. Route names (source=route, `router` span) also come with it, so the reported "needs the Vite plugin for Hapi route names" is refuted by the same run.

Two gotchas found:
1. esbuild require shim is mandatory. Without a banner, esbuild rewrites the CJS `require()` calls left in Hapi/mysql/the injected orchestrion snippet into `__require()`, and workerd dies at startup:
   "service core:user:verify4-hapi-esbuild-nobanner: Uncaught Error: Dynamic require of \"node:async_hooks\" is not supported / at worker.js:33:50 in __require2"
   Fix: `banner.js` that statically imports the node builtins workerd provides and sets `globalThis.require = id => map[id]`. (build-nobanner.mjs reproduces the crash.)
2. The injected snippet's `import '@sentry/server-utils'` resolves to the CJS build under esbuild; a tiny onResolve plugin forcing `node_modules/@sentry/server-utils/build/esm/index.js` avoids that. `@sentry/server-utils` does NOT list `@apm-js-collab/code-transformer-bundler-plugins` as a dependency, but it is vendored into the tarball (build/esm/vendored/...), so no extra install is needed.

Also REFUTED, secondary: "mysql2 cannot be used on workerd". mysql2@3.24.3 works and is instrumented once you pass mysql2's own `disableEval: true` pool option:
  GET /db2/{id}      -> {"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
  {"t":"transaction","n":"GET /db2/{id}","src":"route","spans":["router GET /db2/{id}","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
Without `disableEval` the same pool returns {"error":"Code generation from strings disallowed for this context"} — a mysql2 configuration issue, not an SDK or workerd-vs-Sentry limitation. Note the span is still emitted for the eval pool because the failure happens after the query span opens.

Still true from the original report: `npx wrangler dev` on unbundled source (wrangler's internal esbuild) produces no db span, and there is no supported way to add a plugin to wrangler's own bundler — so "plain wrangler build" remains broken. The reference e2e app (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql) only covers the vite path.

Probe files (node_modules removed; reinstall with `npm install $REPRO/_toolbox/pack/sentry-{cloudflare,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz @hapi/hapi@21 mysql@2 mysql2@3 wrangler@4 esbuild@0.25`):
  $SCRATCH/deep/verify4-M-hapi-cf-dbspans/run-b/src/index.mjs
  .../run-b/build.mjs, build-nobanner.mjs, wrangler.jsonc, wrangler.plain.jsonc, wrangler.nobanner.jsonc
  .../run-b/dev-b.log (with plugin), dev-plain.log (control), dev-c.log (mysql2), dev-nobanner.log (__require crash)
One environment note: the shared directory carried a stale `.wrangler/deploy/config.json` from an earlier run that silently redirected `wrangler dev` to a different, vite-built worker; I overwrote it per run so each result is against the bundle named in its wrangler config.

## Workaround

Bundle the Worker yourself before wrangler sees it: `import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild'` in an esbuild build (format esm, platform node, external ['cloudflare:*'], plus a banner that maps `require` to statically imported node: builtins), set wrangler `main` to the emitted bundle, and run `wrangler dev`. For mysql2 on workerd, pass `disableEval: true` to createPool/createConnection.

## Docs impact

Database spans on Cloudflare Workers require build-time instrumentation from a Sentry bundler plugin, not the Vite plugin specifically: use `sentryCloudflareVitePlugin()` with Vite, or `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/{esbuild,rollup,webpack}` if you pre-bundle your Worker yourself and point wrangler's `main` at the output; wrangler's own bundler takes no plugins, so building straight from source produces no db spans. When pre-bundling with esbuild, add a banner that backs `require` with statically imported `node:` builtins, otherwise workerd fails at startup with `Dynamic require of "node:async_hooks" is not supported`. `mysql2` works on Workers when you pass `disableEval: true` to the connection or pool.
