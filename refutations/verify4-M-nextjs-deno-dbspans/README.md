# verify4-M-nextjs-deno-dbspans

## What it re-tests

Independent re-test of the capability **db spans (Next.js 15.5.4 App Router route handlers on Deno 2.9.0, develop/10.67.0)** of cell `M-nextjs-deno` (see `$REPRO/cells/M-nextjs-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.txt`, `RERUN2.txt`, `app/`, `app.pid`, `build1.log`, `build2-bundlemysql.log`, `deno.json`, `instrumentation.js`, `lib.js`, `minhook/`, `minhook2/`, `next.config.mjs`, `package-lock.json`, `package.json`, `rb-a.pid`, `rb-build-A.log`, `rb-build-A2.log`, `rb-build-A3.log`, `rb-c.pid`, `rb-d.pid`, `rb-e.pid`, `rb-f.pid`, `rb-g.pid`, `rb-server-A.log`, `rb-server-C-hookon-noshim.log`, `rb-server-D-hookon-shim.log`, `rb-server-E-shim2.log`, `rb-server-F-jsonhook.log`, `rb-server-G-stream.log`, `sentry.server.config.js`, `server-bundlemysql.log`, `server-hook.log`, `server-node-bundlemysql.log`, `server-nohook.log`, `server-stream.log`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Still partial, but the reported *reason* ("no instrumentation path is available" / "buildTimeInstrumentation ... does not transform externalized node_modules deps") is REFUTED. Build-time instrumentation works under Deno and produces real db spans for the driver Sentry un-externalizes for exactly that purpose.

Probe: $SCRATCH/deep/verify4-M-nextjs-deno-dbspans (see RERUN.txt for every command; node_modules removed after the run). Wiring identical to the reported one (next.config.mjs default-interop `@sentry/nextjs/config`, instrumentation.js, sentry.server.config.js with `enableRuntimeChannelInjection: false`, tunnel to a local sink), plus `ioredis@5.4.1` (below 5.11, i.e. no native diagnostics_channel, injection-dependent), `mysql2@3.24.3`, `mysql@2.18.1`, all clients created at module scope in lib.js.

A. `deno run -A node_modules/next/dist/bin/next build` + `... next start -p 41338`, default externals, runtime hook OFF, traceLifecycle 'static'. Build succeeded on Deno; `.next/server/chunks/{330,394,829}.js` contain `orchestrion:ioredis` (the webpack orchestrion loader transformed the bundled ioredis at build time). Sink:
  transaction "GET /api/dbredis" spans: ["resolve page components","executing api route (app) /api/dbredis/route","db.query set probe:key [1 other arguments]","db.query get probe:key","start response"]
  transaction "GET /api/dbmysql2" spans: ["resolve page components","executing api route (app) /api/dbmysql2/route","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users","start response"]
  transaction "GET /api/dbmysql" spans: ["resolve page components","executing api route (app) /api/dbmysql/route","start response"]   <- mysql@2: no span (confirms that half)
All routes 200.

B. traceLifecycle 'stream', same build: span envelopes carry the same ioredis spans, so the lifecycle is not the variable.
  span ["resolve page components","db.query set probe:key [1 other arguments]","db.query get probe:key"]
  span ["resolve page components","db mysql2.pool.connect","db mysql2.connect","db SELECT users"]
  span ["resolve page components"]   <- the mysql@2 request

C. Default docs wiring (RUNTIME_INJECTION=1, i.e. no `enableRuntimeChannelInjection: false`) reproduced exactly as reported: server-hook.log:7 "Registered diagnostics-channel injection via Module.registerHooks()", then every route 500s with "⨯ SyntaxError: Unexpected token ':'" (hello=500 dbredis=500 dbmysql2=500 dbmysql=500).
   New, sharper evidence that this is a plain Deno bug and not Sentry's transform: minhook/main.cjs registers a *pass-through* `Module.registerHooks({resolve: next-through, load: next-through})` and then `require('./data.json')` — no Sentry in the process at all. Deno 2.9.0 -> "json FAILED: SyntaxError Unexpected token ':'"; node v26.5.0 -> "json ok: {"a":1}". Deno 2.8.3 not tested: $SCRATCH/deno283/deno does not exist on this machine.

D. Why mysql@2 specifically cannot be rescued: it stays in Sentry's `DEFAULT_SERVER_EXTERNAL_PACKAGES` (packages/nextjs/src/config/withSentryConfig/constants.ts:23-24) while `BUNDLE_SAFE_INSTRUMENTED_PACKAGES = ['ioredis']` (packages/nextjs/src/config/diagnosticsChannelInjection.ts:9) is the only list removed from those externals when buildTimeInstrumentation is on. I forced mysql to be bundled anyway (a webpack-externals wrapper in next.config.mjs, BUNDLE_MYSQL=1, distDir .next-bundlemysql). The build-time transform then fires on Deno — `orchestrion:mysql:` is in the chunks and the span appears: transaction "GET /api/dbmysql" spans ["resolve page components","executing api route (app) /api/dbmysql/route","db SELECT id, name FROM users"] — but the driver itself breaks: HTTP 500, "Error: Received packet in the wrong sequence." then "Error: Cannot enqueue l after fatal error." (mangled class name 'l'). Same failure on Node v26.5.0 with the same build (server-node-bundlemysql.log), so this is a mysql-2.x-cannot-be-bundled defect, not a Deno one, and the allowlist is right to exclude it.

Net: on Deno the db-span story is three-way, not two-way. Native-channel drivers work (mysql2 >= 3.11, ioredis >= 5.11). Build-time-instrumented drivers work (today only ioredis < 5.11, via the orchestrion webpack loader — no runtime hook needed). Drivers that stay external and depend on the runtime module hook (mysql 2.x, pg, and everything else in Sentry's serverExternalPackages defaults) record nothing, because `Module.registerHooks` has to be off for Next.js to serve a single request on Deno.

Not tested: pg/mongodb (no server available), Turbopack (`resolveBuildTimeInstrumentationOption` disables build-time instrumentation on Turbopack below Next 16, so it can only be worse), Deno 2.8.3 (binary missing). There is no Next.js-on-Deno e2e app in the repo to use as a reference, and `enableRuntimeChannelInjection` appears nowhere in ~/dev/sentry-docs.

## Workaround

Next.js on Deno needs `enableRuntimeChannelInjection: false` in `Sentry.init()` (sentry.server.config.js) or every request 500s with `SyntaxError: Unexpected token ':'`. With that set, db spans still arrive for drivers that do not need the runtime module hook: mysql2 >= 3.11 and ioredis >= 5.11 (own diagnostics_channel), and ioredis < 5.11 (bundled and transformed at build time by `withSentryConfig`'s default `buildTimeInstrumentation`, which requires the webpack builder — do not pass `--turbopack` on Next 15, and do not set `buildTimeInstrumentation: false`). For mysql 2.x / pg there is no workaround: forcing them out of `serverExternalPackages` does produce the span but corrupts the driver on Node as well as Deno.

## Docs impact

On Deno, add `enableRuntimeChannelInjection: false` to `Sentry.init()` in `sentry.server.config.js` — Deno cannot run the diagnostics-channel module hook (`require()` of a `.json` file throws `SyntaxError: Unexpected token ':'`, denoland/deno#36240), so Next.js 500s on every request without it; with it, database and other library spans are recorded only for packages that ship their own `diagnostics_channel` (mysql2 >= 3.11, ioredis >= 5.11) or that Sentry instruments at build time (ioredis < 5.11, which needs the default webpack builder and `buildTimeInstrumentation`), while drivers Sentry keeps in `serverExternalPackages` — mysql 2.x, pg — produce no spans on Deno.
