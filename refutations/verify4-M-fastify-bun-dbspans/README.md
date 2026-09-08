# verify4-M-fastify-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-fastify-bun` (see `$REPRO/cells/M-fastify-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app.mjs`, `app2.mjs`, `app3.mjs`, `appH.mjs`, `drive.mjs`, `drive2.mjs`, `driveH.mjs`, `instrument.mjs`, `package-lock.json`, `package.json`, `preload-plugin.mjs`, `runA-app.log`, `runA-drive.log`, `runA.pid`, `runB-app.log`, `runB-drive.log`, `runC-app.log`, `runC-drive.log`, `runD-app.log`, `runD-drive.log`, `runE-app.log`, `runE-items.json`, `runF-app.log`, `runG-app.log`, `runG-items.json`, `runH-app.log`, `runH-drive.log`, `runH.pid`, `runI-app.log`, `runI-drive.log`, `runI.pid`, `runJ-app.log`, `runJ-drive.log`, `runJ-items.json`, `runJ.pid`, `runK-app.log`, `runL-app.log`, `runL-drive.log`, `runL-items.json`, `runL.pid`, `runM-app.log`, `runM-drive.log`, `runM.pid`, `sink.log`, `sink.pid`, `sinkH.log`, `sinkH.pid`, `sinkJ.log`, `sinkJ.pid`, `sinkL.log`, `sinkL.pid`, `sinkraw.mjs`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The Bun plugin build is NOT required for db spans on Fastify + Bun. The reported "partial" is driver-specific, not a Bun/Fastify limitation: `mysql@2` needs the bundle, `mysql2 >= 3.20.0` does not.

EXACT CHANGE: use `mysql2` (tested 3.24.3) instead of `mysql@2.18.1`. Nothing else changes — same `instrument.mjs`, same `import "./instrument.mjs"` first line, plain `bun app.mjs`, no `Bun.build`, no `sentryBunPlugin()`.

Why: `mysql2 >= 3.20.0` publishes native `node:diagnostics_channel` channels (`mysql2:query`, `:execute`, `:connect`, `:pool:connect`). `mysql2Integration` in `@sentry/server-utils` subscribes to them EAGERLY in `setupOnce()` (packages/server-utils/src/integrations/mysql2/index.ts:149-166), so no require-hook and no build-time channel injection is involved. `mysql@2` has no native channels, so it only works through the orchestrion transform that `@sentry/bun/plugin` applies at bundle time — which is exactly what the repo's own e2e app does (dev-packages/e2e-tests/test-applications/bun-mysql/{build.ts,src/app.ts}, `mysql: 2.18.1`, `bun run dist/app.js`).

EVIDENCE — one Fastify process, both drivers at module scope, plain `bun appH.mjs`, traceLifecycle static (runH-drive.log):
  GET /db-mysql1        | ["handler GET /db-mysql1","handler fastify - route-handler"]                                                          <- mysql@2: NO db span
  GET /db-mysql2-query  | ["handler GET /db-mysql2-query","handler fastify - route-handler","db SELECT id, name FROM users"]
  GET /db-mysql2-execute| ["handler GET /db-mysql2-execute","handler fastify - route-handler","db SELECT id, name FROM users WHERE id = ?"]
  GET /db-mysql2-pool   | ["handler GET /db-mysql2-pool","handler fastify - route-handler","db mysql2.pool.connect","db mysql2.connect","db SELECT name FROM users WHERE id = ?"]

Same app, traceLifecycle stream (default), runJ-items.json — identical result, low-cardinality names:
  span | ["handler /db-mysql1","handler /db-mysql1","http.server GET /db-mysql1"]
  span | ["db SELECT users","handler /db-mysql2-query","handler /db-mysql2-query","http.server GET /db-mysql2-query"]
  span | ["db SELECT users","handler /db-mysql2-execute","handler /db-mysql2-execute","http.server GET /db-mysql2-execute"]
  span | ["db mysql2.pool.connect","db mysql2.connect","db SELECT users","handler /db-mysql2-pool","handler /db-mysql2-pool","http.server GET /db-mysql2-pool"]

The span is full quality, not degraded (runL-items.json, raw attributes):
  {"name":"SELECT users","attributes":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT id, name FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307,"sentry.segment.name":"GET /db-mysql2-query","sentry.sdk.name":"sentry.javascript.bun"}}

K11 does NOT apply to mysql2 on this path. A route that `await import("mysql2/promise")`s and creates the connection INSIDE the request still gets spans, because the channel subscription happens at `Sentry.init()` time, not at module-load time (runM-drive.log, plain `bun app2.mjs`):
  GET /db-lazy | ["handler GET /db-lazy","handler fastify - route-handler","db mysql2.connect","db SELECT id, name FROM users WHERE id = ?"]

WHAT DOES NOT RESCUE mysql@2: registering the plugin as a runtime Bun plugin instead of a build plugin. `bun --preload ./preload-plugin.mjs app3.mjs`, where preload-plugin.mjs is `Bun.plugin(sentryBunPlugin()); await import("./instrument.mjs")`, crashes at import (runK-app.log):
  SyntaxError: Missing 'default' export in module '.../node_modules/mysql/index.js'
      at <parse> (1:1)
So for `mysql@2` the `Bun.build` + `sentryBunPlugin()` step from the toolbox/e2e recipe is genuinely the only route, and the bundle-vs-runtime distinction is real.

COMMANDS (probe files in $SCRATCH/deep/verify4-M-fastify-bun-dbspans/):
  npm install $S/pack/sentry-{bun,node,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz fastify@5 mysql@2 mysql2@3
  PORT=52117 node $S/qs/sink.mjs &                                    # or ./sinkraw.mjs for full span attributes
  SINK_PORT=52117 APP_PORT=52118 LIFECYCLE=static bun appH.mjs &      # plain bun run, no build step
  SINK_PORT=52117 APP_PORT=52118 node driveH.mjs                      # separate plain-node driver, sentinel-gated
Files: appH.mjs (fastify, mysql@2 AND mysql2 at module scope, four db routes + /sentinel), app2.mjs (mysql2 only, incl. /db-lazy), app3.mjs (mysql@2, no instrument import, for the --preload variant), instrument.mjs, driveH.mjs, drive2.mjs, sinkraw.mjs, preload-plugin.mjs; logs runH-*, runJ-*, runK-app.log, runL-items.json, runM-*.

Ports note: my first attempt used sink port 47311 and another concurrently running agent's app was tunneling into it, polluting the items list (runI-drive.log shows foreign `GET /users/7` transactions). Reran on 52117/52121, which were clean. Bun 1.4.0, @sentry/bun 10.67.0, fastify 5.12.3, mysql 2.18.1, mysql2 3.24.3, MariaDB on 127.0.0.1:3307.

## Workaround

Use `mysql2` (>= 3.20.0) rather than `mysql@2`. Create the connection or pool at module scope (or lazily — either works), keep `import "./instrument.mjs"` as the first line of the entry, and run `bun app.mjs` with no build step; db spans appear under the Fastify handler spans in both `stream` and `static` trace lifecycles. If you are stuck on `mysql@2`, the bundle really is required: `Bun.build({ entrypoints: ["./app.mjs"], outdir: "./dist", target: "bun", external: ["@sentry/bun", "mysql"], plugins: [sentryBunPlugin()] })` then `bun dist/app.js` — the plugin strips instrumented packages back out of `external` so `mysql` gets bundled and transformed. Registering `sentryBunPlugin()` as a runtime `Bun.plugin` via `--preload` is not an alternative; it breaks `mysql`'s CJS default export.

## Docs impact

The Bun guide needs a "Database instrumentation" section stating: libraries that publish native `diagnostics_channel` events — `mysql2` 3.20.0 and newer — are instrumented by a plain `bun app.js` run with no build step, while libraries without native channels — `mysql` v2 among them — are only instrumented when the app is bundled with `Bun.build` and `sentryBunPlugin()` from `@sentry/bun/plugin` (listing the package in `external` is fine, the plugin removes instrumented packages from that list so they are still transformed); registering that plugin at runtime through `Bun.plugin()` in a `--preload` file does not work and breaks CommonJS default exports. This also contradicts the current text at ~/dev/sentry-docs/docs/platforms/javascript/guides/bun/index.mdx:98 ("Sentry's auto-instrumentation does not work with bundled code... you'll need to manually instrument your code"), which is now backwards for library spans: on this SDK line bundling with the Sentry plugin is what turns library auto-instrumentation on, and that line must be rewritten rather than left alongside the new section.
