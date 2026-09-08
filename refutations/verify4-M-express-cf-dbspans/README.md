# verify4-M-express-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-express-cf` (see `$REPRO/cells/M-express-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO.md`, `build-esbuild.mjs`, `build-esbuild2.mjs`, `build-esbuild3.mjs`, `esbuild.log`, `package-lock.json`, `package.json`, `sink.log`, `sink.pid`, `src/`, `src2/`, `src3/`, `src4/`, `vite.config.b.mjs`, `vite.config.c.mjs`, `vite.config.mjs`, `vite.config.nosentry.mjs`, `vite.config.stream.mjs`, `vite.config.top.mjs`, `viteB.log`, `viteDev.log`, `viteDev.pid`, `viteStream.log`, `viteTop.log`, `wA.log`, `wA.pid`, `wB.log`, `wB.pid`, `wB2.log`, `wB2.pid`, `wB3.log`, `wB3.pid`, `wC.log`, `wC.pid`, `wC2.log`, `wC2.pid`, `wDbg.log`, `wDbg.pid`, `wDev.log`, `wDev.pid`, `wDevNS.log`, `wDevNS.pid`, `wESB.log`, `wESB.pid`, `wESB2.log`, `wESB2.pid`, `wESB3.log`, `wESB3.pid`, `wS.log`, `wS.pid`, `wStream.log`, `wStream.pid`, `wTop.log`, `wTop.pid`, `wrangler.b.jsonc`, `wrangler.debug.jsonc`, `wrangler.esbuild.jsonc`, `wrangler.esbuild2.jsonc`, `wrangler.esbuild3.jsonc`, `wrangler.jsonc`, `wrangler.stream.jsonc`, `wrangler.top.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Reproduced the reporter's setup independently in $SCRATCH/deep/verify4-M-express-cf-dbspans (express@5.2.0, wrangler 4.129.0, workerd 1.20260903.1, compatibility_date 2026-05-01, flags nodejs_compat + enable_nodejs_http_server_modules, @sentry/cloudflare 10.67.0 from $REPRO/_toolbox/pack tarballs, MariaDB on 127.0.0.1:3307, sink on 43211). db spans are COMPLETE and CORRECT on the documented wiring, so I do not think this is a partial.

1) Vite plugin path, traceLifecycle 'static' (src/index.js, `npx vite build --config vite.config.mjs && npx wrangler dev --config dist/v4_express_db/wrangler.json --port 52411 --inspector-port 0`):
  transaction | GET /db | source= route | spans= ['handler /db', 'db mysql2.connect', 'db SELECT id, name FROM users']
  transaction | GET /db-legacy | source= route | spans= ['handler /db-legacy', 'db SELECT id, name FROM users']
  transaction | GET /users/:id | source= route | spans= ['handler /users/:id']
The db spans are nested under the express `handler` span of the same request, not siblings. Both drivers work: `mysql2/promise` AND the plain `mysql@2.18.1` driver used by the repo's own e2e app.

2) Attributes are complete (raw payload from the sink):
  {"op":"db","description":"SELECT id, name FROM users","status":"ok","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT id, name FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}
  {"op":"db","description":"mysql2.connect","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","db.system.name":"mysql","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}

3) The other trace lifecycle also works (`--var LIFECYCLE:stream`), with the low-cardinality query name:
  span envelope | ['db mysql2.connect', 'db SELECT users', 'handler /db', 'http.server GET /db']

4) Confirmed the reporter's negative: plain `npx wrangler dev --config wrangler.jsonc` over the same source gives
  transaction | GET /db | source= url | spans= []
and, with debug:true, the SDK installs only Dedupe/EventFilters/FunctionToString/ConversationId/LinkedErrors/Fetch/HttpServer/RequestData/Console — no Mysql2 or Express integration and NO warning that build-time instrumentation is missing. This is by design: packages/cloudflare/src/baseSdk.ts:64 pulls db subscribers from `getRegisteredChannelIntegrations()`, which is only populated by the build-time channel injection; there is no runtime monkey-patching on workerd. Requiring the Vite plugin is therefore the documented, recommended path (~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/features/vite-plugin.mdx:18 "We recommend building your Cloudflare Worker with Vite and the sentryCloudflareVitePlugin plugin. It's the most complete way to get tracing for bundled dependencies in the Workers runtime."), and the repo's own reference app dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql uses exactly `cloudflare() + sentryCloudflareVitePlugin()`.

Refutation attempts that did NOT open an alternative path (all recorded, none change the verdict):
- Non-Vite bundling: `@sentry/server-utils/orchestrion/esbuild` exists and DOES inject (`orchestrion:mysql2:query` / `orchestrion:mysql2:execute` present in dist-esbuild*/index.js), but a hand-rolled esbuild pre-bundle does not boot on workerd — `Uncaught Error: Dynamic require of "tty" is not supported`, then after node:-prefixing and a createRequire banner `Uncaught Error: No such module "node:process"` — because pre-bundling bypasses wrangler's/@cloudflare/vite-plugin's unenv node-compat aliasing. `@sentry/cloudflare` exports only ".", "./request" and "./vite", so there is no supported non-Vite path.
- `vite dev` (which the docs offer as the replacement for `wrangler dev`) cannot start this app at all: `TypeError: The "superCtor.prototype" property must be of type object. Received undefined` in @cloudflare/vite-plugin's runner-worker. This is NOT Sentry's fault — the identical failure occurs with `cloudflare()` alone (vite.config.nosentry.mjs, wDevNS.log). Use `vite build` + `wrangler dev` for express-on-workerd.

One real caveat, and it is an express defect rather than a db defect: with `buildTimeInstrumentation` on (the default), registering routes at module scope crashes the Worker at startup —
  ✘ [ERROR] service core:user:v4_express_db_b: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
      at null.<anonymous> (index.js:58643:37) in route2
Line 58643 of distb/v4_express_db_b/index.js is `return tr_ch_apm$register.start.runStores(__apm$ctx, () => {`, i.e. the injected `orchestrion:router:register` channel already has subscribers at module-evaluation time (the injected snippet runs `globalThis.__SENTRY_ORCHESTRION_INJECT__ = orchestrionModuleInjected("router", expressIntegration)` when `router` is first required) and the subscriber does work workerd forbids in global scope. Control proves Sentry causes it: the same src2/index.js built with `sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })` (vite.config.c.mjs, distc) boots and serves `/db` fine. Module-scope `import mysql from 'mysql2/promise'` is not affected — only calling an instrumented express API at module scope is. Creating the mysql connection inside the request handler is fine on workerd and still produces both db spans.

Also confirmed: mysql2 needs `disableEval: true` in the connection options; without it the query text generation throws `EvalError: Code generation from strings disallowed for this context` (the connect and query spans are still emitted). The `mysql@2` driver needs no such flag.

Files: src/index.js (working lazy app), src2/index.js (module-scope crash case), vite.config.mjs / vite.config.b.mjs / vite.config.c.mjs, wrangler.jsonc / wrangler.b.jsonc, build-esbuild{,2,3}.mjs, REPRO.md, logs wS.log wStream.log wA.log wB3.log wC.log wESB*.log wDev.log wDevNS.log — all under $REPRO/refutations/verify4-M-express-cf-dbspans/. node_modules removed; reinstall per REPRO.md (remember `npm approve-scripts --allow-scripts-pending && npm rebuild`, otherwise workerd and esbuild have no binary). All processes I started were killed.

## Workaround

Build the Worker with Vite: `vite.config.mjs` = `defineConfig({ plugins: [cloudflare(), sentryCloudflareVitePlugin()] })`, then `npx vite build && npx wrangler dev --config dist/<worker>/wrangler.json` (not plain `wrangler dev`, and not `vite dev` — that shape cannot start express on workerd at all). Because the injected express channel makes a module-scope `app.get(...)` crash the Worker in global scope, build the express app lazily on the first request: keep `const inner = httpServerHandler({ port: 8080 })` at module scope but create the app and call `app.listen` inside `fetch` (`let listening; async fetch(req, env, ctx) { if (!listening) { const app = buildApp(); listening = new Promise(r => app.listen(8080, r)); } await listening; return inner.fetch(req, env, ctx); }`). Create the mysql connection inside the route handler and pass `disableEval: true` for `mysql2`.

## Docs impact

On the Cloudflare guide's Vite Plugin page, state that database spans on Workers only exist when the Worker is built with `sentryCloudflareVitePlugin()` — a Worker deployed with plain `wrangler dev`/`wrangler deploy` emits no db spans and logs no warning — and correct the page to the shipped option shape (top-level `buildTimeInstrumentation` and `autoInstrumentation`, both default `true`, not `_experimental.useDiagnosticsChannelInjection`/`_experimental.autoInstrumentation` defaulting to `false`); add that with build-time instrumentation on, an Express app must register its routes inside the request handler rather than at module scope, or the Worker fails to start with "Disallowed operation called within global scope".
