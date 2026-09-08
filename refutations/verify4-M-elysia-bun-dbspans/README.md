# verify4-M-elysia-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans (Elysia 1.4 + @sentry/elysia 10.67.0 on bun 1.4.0)** of cell `M-elysia-bun` (see `$REPRO/cells/M-elysia-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app.ts`, `app_preload.ts`, `build.ts`, `instrument.ts`, `package-lock.json`, `package.json`, `preload.ts`, `raw-run3.json`, `raw.ndjson`, `rawsink.log`, `rawsink.mjs`, `run1-plain-static.log`, `run2-preload-plugin.log`, `run3-bundled-static.log`, `run4-bundled-stream.log`, `run5-plain-debug.log`, `runA.log`, `runB.log`, `runD.log`, `runE.log`, `runF.log`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Could not refute. Reproduced the reported split exactly, in both trace lifecycles, and every refutation attempt failed.

Probe dir: $SCRATCH/deep/verify4-M-elysia-bun-dbspans (app.ts, instrument.ts, build.ts, preload.ts, run1..run5 logs, raw-run3.json). node_modules removed after the run; recreate with:
npm install elysia@1.4 mysql2 mysql@2.18.1 $REPRO/_toolbox/pack/sentry-{elysia,bun,node,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz
Sink: PORT=47231 node $REPRO/_toolbox/sink.mjs. App is one Elysia app, Sentry.withElysia(new Elysia()), module-scope mysql2 pool AND module-scope mysql@2 connection, routes /m2/:id and /m1/:id, MariaDB 127.0.0.1:3307.

Run 1 — `SINK_PORT=47231 APP_PORT=41903 LIFECYCLE=static bun app.ts` (no bundler, documented wiring, instrument.ts imported first):
  GET /m2/:id | http.server | spans: ['middleware Request', ..., 'handler Handle', 'db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT id, name FROM users WHERE id = ?', ...]
  GET /m1/:id | http.server | spans: ['middleware Request', ..., 'handler Handle', 'middleware AfterHandle', ...]   <- no db span
mysql2 works with no plugin; mysql@2 produces nothing. Confirms the report.

Run 2 (refutation attempt: runtime plugin instead of a bundle) — preload.ts sets globalThis.__SENTRY_ORCHESTRION__ = { bundler: new Set() } and calls Bun.plugin(sentryBunPlugin()), then `bun --preload ./preload.ts app.ts`. The process dies at import:
  SyntaxError: Missing 'default' export in module '.../node_modules/mysql2/promise.js'
  Bun v1.4.0 (macOS arm64)
So the runtime hook not only fails to add mysql@2 spans, it breaks the driver that worked. This is intentional: packages/server-utils/src/orchestrion/bundler/bun.ts says "This is BUILD-ONLY. Runtime instrumentation (`bun run`) is intentionally not offered: a module returned by a runtime `onLoad` plugin in Bun loses its CommonJS named exports" (blocked on oven-sh/bun#31770). PluginOptions (bundler/options.ts) has no way to narrow the transform to one package, so a selective runtime plugin is not reachable through the public API either.

Run 3 — `bun build.ts` (Bun.build, entrypoints ['./app.ts'], target 'bun', sourcemap 'external', plugins [sentryBunPlugin()], NO `external` at all) then `LIFECYCLE=static bun dist/app.js`: both drivers produce db spans and Elysia routing is unchanged:
  GET /m1/:id | http.server | spans: [... 'handler Handle', 'db SELECT id, name FROM users', ...]
  GET /m2/:id | http.server | spans: [... 'db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT id, name FROM users WHERE id = ?', ...]
Attributes on the bundled mysql@2 span are complete: sentry.origin auto.db.mysql, db.system.name mysql, db.namespace app, db.user root, db.query.text "SELECT id, name FROM users", db.query.summary "SELECT users", server.address 127.0.0.1, server.port 3307.

Run 4 — same bundle, LIFECYCLE=stream: both drivers land in the request trace with low-cardinality names:
  8a0b130b | db SELECT users | parent= 8bdb1e18 | origin= auto.db.mysql        (mysql@2, /m1)
  82245f5d | db SELECT users | parent= 9df9c06c | origin= auto.db.mysql2.diagnostic_channel (/m2)
  8a0b130b | http.server GET /m1/:id | parent= - | origin= auto.http.elysia

Run 5 — plain `bun app.ts` with debug: true. The SDK gives no actionable warning; it logs
  Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
  Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
  Sentry Logger [log]: Integration installed: Mysql
i.e. it reports the mysql integration as installed while no channel will ever publish. Without debug there is no output at all, so the silent gap is invisible.

Two secondary observations: (a) db spans parent to the http.server root span, not to the `handler` span, in both drivers and both lifecycles; (b) mysql2 emits two extra connection spans (`mysql2.pool.connect`, `mysql2.connect`) on the first request through a pool.

Reference: the repo's own e2e apps agree — dev-packages/e2e-tests/test-applications/bun-mysql uses build.ts with sentryBunPlugin() for mysql@2, while elysia-bun runs `bun src/app.ts` with no bundler and has no db test.

## Workaround

Either use `mysql2` (it publishes node:diagnostics_channel itself, so db spans work under plain `bun app.ts` with no build step), or, for any driver that does not — `mysql`@2 among them — add a build step: build.ts with `Bun.build({ entrypoints:['./app.ts'], outdir:'./dist', target:'bun', sourcemap:'external', plugins:[sentryBunPlugin()] })` from `@sentry/bun/plugin`, then run `bun dist/app.js`. Do not pass any `external` (and never `packages:'external'` or `'*'`), and do not try `Bun.plugin(sentryBunPlugin())` in a `--preload` file: it is build-only and crashes the app at import.

## Docs impact

On Bun, `@sentry/elysia` instruments only libraries that publish `node:diagnostics_channel` events themselves (e.g. `mysql2`); for every other library — `mysql`, Express, Koa, Fastify, Hapi, AI SDKs — you must bundle your app with `Bun.build({ ..., plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run the bundle (`bun dist/app.js`), because there is no runtime instrumentation hook on Bun; without that build step the spans are silently missing, and registering the plugin via `Bun.plugin()` in a `--preload` file is not supported and will break CommonJS imports.
