# verify4-M-nextjs-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-nextjs-cf` (see `$REPRO/cells/M-nextjs-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `NOTES.md`, `body-db.json`, `body-db2.json`, `build-A.log`, `build-B.log`, `build-C.log`, `build-D.log`, `build-E.log`, `build-F.log`, `install1.log`, `install2.log`, `install3.log`, `next-env.d.ts`, `next.config.js`, `next.config.variantA.js.bak`, `open-next.config.ts`, `package-lock.json`, `package.json`, `raw-D.json`, `sentry.edge.config.ts`, `sentry.edge.config.ts.bak2`, `sentry.server.config.ts`, `sentry.server.config.ts.bak`, `sentry.server.config.ts.bak2`, `sink-F.log`, `sink.log`, `sink.pid`, `sinkF.pid`, `src/`, `tsconfig.json`, `wr.pid`, `wrB.pid`, `wrC.pid`, `wrD.pid`, `wrE.pid`, `wrF.pid`, `wrangler-A.log`, `wrangler-B.log`, `wrangler-C.log`, `wrangler-D.log`, `wrangler-E.log`, `wrangler-F.log`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Re-verified from scratch (fresh `npm install`, fresh `opennextjs-cloudflare build`, new ports) in $SCRATCH/deep/verify4-M-nextjs-cf-dbspans. Next 15.5.25 App Router + @opennextjs/cloudflare 1.20.6 + @sentry/nextjs 10.67.0 (develop tarballs), wrangler dev 4.129.0, compatibility_date 2026-05-01, nodejs_compat, MariaDB 127.0.0.1:3307. Sink 51873, worker 51874, `traceLifecycle: 'stream'`, documented wiring (`withSentryConfig` from `@sentry/nextjs/config` in a CJS next.config.js, `src/instrumentation.ts` -> `../sentry.server.config`).

REFUTED — caveat (a) "you get spans but a 500". mysql2 works end to end; the EvalError was purely mysql2's `new Function` row-parser compiler, and mysql2's own `disableEval: true` connection option removes it. Nothing about the SDK changes:

  curl /api/db2 -> HTTP 200 {"driver":"mysql2","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}

  sink __items (stream lifecycle):
  span ['resolve page components', 'db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT users']
  span ['executing api route (app) /api/db2/route', 'start response', 'http.server GET /api/db2']
  (origin on all three db spans: auto.db.mysql2.diagnostic_channel)

  With `traceLifecycle: 'static'` (earlier variant D, raw-D.json + wrangler-D.log in the same dir) the same run gives `GET /api/db2 200 OK (253ms)` and a transaction whose spans[] contains db `mysql2.pool.connect` / `mysql2.connect` / `SELECT id, name FROM users`, each `"origin": "auto.db.mysql2.diagnostic_channel"`, `db.system.name: mysql`, `db.namespace: app`, `server.address: 127.0.0.1`, `server.port: 3307`.
  Without `disableEval` (variant A, wrangler-A.log:231-285) the same route gives the reported failure verbatim: `Sentry Logger [log]: Captured error event `Code generation from strings disallowed for this context`` ... `[wrangler:info] GET /api/db2 500 Internal Server Error (24ms)` — spans still emitted.

CONFIRMED — caveat (b) mysql@2 gets no spans. Same run: `curl /api/db -> HTTP 200 {"driver":"mysql","rows":[...]}` and the trace has only `['executing api route (app) /api/db/route', 'start response', 'http.server GET /api/db']`, no db span. Root cause found in the SDK, not just observed: packages/nextjs/src/config/diagnosticsChannelInjection.ts:9 `export const BUNDLE_SAFE_INSTRUMENTED_PACKAGES = ['ioredis'];` — with build-time instrumentation on, only ioredis is dropped from Sentry's `serverExternalPackages` defaults, so every other instrumented package (mysql, pg, ...) stays external and depends on the runtime module hook, and that hook cannot register on workerd: `[Sentry] Failed to register diagnostics-channel injection hooks ... TypeError: port1.on is not a function` / `Sentry Logger [log]: [Sentry] Runtime hook not registered` / `[Sentry] Bundler plugin ran, injected libraries=[]`. Forcing mysql into the webpack bundle (variant B: user `serverExternalPackages` filtered to drop mysql/mysql2) does make injection work — `[instrumentation:mysql] "mysql" injected at runtime, subscribing now` then a `db` span `SELECT id, name FROM users` — but the bundled driver then dies with `Error: Received packet in the wrong sequence.` / `code: 'PROTOCOL_INCORRECT_PACKET_SEQUENCE'` and a 500; variant C shows the identical failure with `buildTimeInstrumentation: false`, so bundling mysql@2 for workerd is broken independently of Sentry. So mysql@2 is a real dead end here, matching the SDK's own comment that mysql 2.x is not bundle-safe.

Net: on Next.js/OpenNext/workerd you get db spans only for drivers that publish their own diagnostics channels (mysql2 does; `.open-next/server-functions/default/node_modules/mysql2/lib/tracing.js`). For those, spans and a working query both work with no extra plugin or build step. Reproduce: `npm install`, `npx opennextjs-cloudflare build`, `PORT=51873 node $REPRO/_toolbox/sink.mjs &`, `npx wrangler dev --port 51874 --inspector-port 0`, `curl 127.0.0.1:51874/api/db2`, `curl 127.0.0.1:51873/__items`. Files: next.config.js, sentry.server.config.ts, src/instrumentation.ts, src/app/api/db/route.ts (mysql@2), src/app/api/db2/route.ts (mysql2 + disableEval), logs build-F.log / wrangler-F.log / sink-F.log plus the earlier per-variant wrangler-A..E.log and raw-D.json, all under that directory. node_modules removed after the run.

## Workaround

For mysql2 on Cloudflare Workers, pass mysql2's own `disableEval: true` in the connection/pool options (`mysql2.createPool({ host, port, user, database, disableEval: true })`). workerd forbids `new Function`, and mysql2 compiles its row parsers that way; `disableEval` switches it to the static parsers, after which the query returns rows (HTTP 200) and the `db mysql2.pool.connect` / `db mysql2.connect` / `db SELECT <table>` spans arrive unchanged. This is app-side driver config, no Sentry option involved. There is no workaround for mysql@2 (or any driver without built-in diagnostics channels): the runtime module hook cannot register on workerd, and pulling mysql into the webpack bundle via `serverExternalPackages` yields spans but breaks the driver with PROTOCOL_INCORRECT_PACKET_SEQUENCE even with Sentry's build-time instrumentation disabled.

## Docs impact

On docs/platforms/javascript/guides/cloudflare/frameworks/nextjs.mdx (which today ends at "you should start seeing error events, traces, and logs"), add: "Database spans on Workers only come from drivers that publish their own diagnostics channels, such as mysql2; drivers instrumented through Sentry's runtime module hook (for example mysql 2.x) produce no spans there, because the hook cannot register on workerd. With mysql2, also pass `disableEval: true` in your connection options — the Workers runtime forbids `new Function`, which mysql2 otherwise uses to build its row parsers."
