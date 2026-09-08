# verify4-M-nestjs-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-nestjs-cf` (see `$REPRO/cells/M-nestjs-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `raw.ndjson`, `raw.pid`, `raw2.log`, `raw2.ndjson`, `raw2.pid`, `rawsink.log`, `rawsink.mjs`, `run1-sink.log`, `run1-wrangler.log`, `run1.pid`, `run2-wrangler.log`, `run2.pid`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `wrA.pid`, `wrB.pid`, `wrangler-A.log`, `wrangler-B.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The reported "partial" rested on one claim: "mysql2 cannot run on workerd at all (EvalError: Code generation from strings disallowed), only mysql@2 works". That is refuted. mysql2 has a first-class config flag, `disableEval: true` (mysql2 3.24.3, `lib/connection_config.js:62`, honored in `lib/commands/query.js:225` and `lib/commands/execute.js:39`), which switches the row parsers off the `new Function` path. With it, mysql2 runs on workerd and produces fully attributed db spans, including prepared statements via `.execute()`.

Same app, same wiring as the original probe (NestJS 11 + platform-express, `httpServerHandler` bridge, lazy Nest boot, esbuild + `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild`, wrangler 4.129.0 dev, compatibility_date 2026-05-01, `nodejs_compat` + `enable_nodejs_http_modules` + `enable_nodejs_http_server_modules`), only the driver config changed.

A/B on the eval flag, one wrangler process, six routes (verbatim HTTP responses):
  /db2fresh        (mysql2 createConnection, disableEval: true) -> {"ok":true,"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
  /db2fresh-eval   (mysql2 createConnection, no flag)           -> {"ok":false,"err":"EvalError: Code generation from strings disallowed for this context | at Function (<anonymous>) | at line.toFunction (.../worker.js:140167:25)"}
  /db2exec         (mysql2 .execute prepared, disableEval)      -> {"ok":true,"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
  /db2pool         (mysql2 createPool, disableEval)             -> rows on a cold isolate, see pool caveat below
  /db               (mysql@2 module-scope pool, baseline)       -> rows

Sink, traceLifecycle 'static' (verbatim, trimmed to name + spans):
  GET /db        :: middleware <anonymous> ; middleware jsonParser ; middleware urlencodedParser ; handler /db ; db SELECT id, name FROM users
  GET /dbfresh   :: middleware <anonymous> ; middleware jsonParser ; middleware urlencodedParser ; handler /dbfresh ; db SELECT id, name FROM users
  GET /db2fresh  :: middleware <anonymous> ; middleware jsonParser ; middleware urlencodedParser ; handler /db2fresh ; db mysql2.connect ; db SELECT id, name FROM users
  GET /db2exec   :: middleware <anonymous> ; middleware jsonParser ; middleware urlencodedParser ; handler /db2exec ; db mysql2.connect ; db SELECT id, name FROM users WHERE id > ?
  GET /db2pool   :: middleware <anonymous> ; middleware jsonParser ; middleware urlencodedParser ; handler /db2pool ; db mysql2.pool.connect ; db mysql2.connect ; db SELECT id, name FROM users

Raw span data for the mysql2 spans (from a raw envelope sink, verbatim):
  {"d":"SELECT id, name FROM users","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT id, name FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}
  {"d":"SELECT id, name FROM users WHERE id > ?","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT id, name FROM users WHERE id > ?","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}
  {"d":"mysql2.connect","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}

Other trace lifecycle also works (the develop default, `traceLifecycle: 'stream'`, span envelopes, low-cardinality names):
  span ["middleware urlencodedParser","middleware jsonParser","middleware <anonymous>","db mysql2.connect","db SELECT users","handler /db2fresh","http.server GET /db2fresh"]
  span ["middleware urlencodedParser","middleware jsonParser","middleware <anonymous>","db mysql2.pool.connect","db mysql2.connect","db SELECT users","handler /db2pool","http.server GET /db2pool"]
  span ["middleware urlencodedParser","middleware jsonParser","middleware <anonymous>","db SELECT users","handler /dbfresh","http.server GET /dbfresh"]
So db spans work for both drivers under both lifecycles.

Bundler/hook variant re-confirmed, not refuted: the same source built with `plugins: [processPlugin]` only (build-noorch.mjs -> dist-noorch, wrangler-noorch.jsonc) yields no db spans, no express spans and an unrouted server span:
  span ["http.server GET"]   <- /dbfresh and /db2fresh, no-orchestrion build
So `sentryOrchestrionPlugin()` (or the Vite plugin's buildTimeInstrumentation) is genuinely required; that part of the original report stands.

New caveat the original report gets backwards (affects the query, not the span): module-scope connection pools are the wrong shape on workerd. The module-scope mysql2 pool intermittently fails with "Error: Cannot perform I/O on behalf of a different request. I/O objects ... created in the context of one request handler cannot be..." on requests that reuse a socket opened by an earlier request (rounds 1 and 3 of 3 failed, round 2 passed), and the module-scope mysql@2 pool the original probe recommends silently costs 10 seconds on every request after the first (measured `[10.012133s]`, `[10.008806s]`, `[10.007499s]` vs `[0.005991s]` for a per-request connection). A connection created inside the handler is fast and correct for both drivers, and still gets spans, because instrumentation is injected at bundle time, not at first module load (the Bun K11 "module scope only" rule does not apply here). The repo's own e2e app agrees: dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql/src/index.ts creates the connection inside `fetch` with the comment "workerd forbids I/O in global scope, and mysql opens its socket lazily on the first query", and its tests assert `sentry.origin: auto.db.mysql`, `db.system.name`, `db.query.text`, `server.address/port`.

Files (all absolute, rerunnable): $SCRATCH/deep/verify4-M-nestjs-cf-dbspans/app/src/db.ts (both drivers, pool + fresh, eval + disableEval), app/src/app.controller.ts (routes /db /dbfresh /db2pool /db2pool-eval /db2fresh /db2fresh-eval /db2exec /sentinel), app/src/main.ts (tunnel + traceLifecycle), app/build.mjs (with orchestrion) and app/build-noorch.mjs (without), app/wrangler.jsonc and app/wrangler-noorch.jsonc, run1-wrangler.log / run2-wrangler.log, raw2.ndjson (raw envelopes), rawsink.mjs.
Commands: (in app/) `npx tsc -p tsconfig.json; node build.mjs` then `npx wrangler dev --port 45107 --inspector-port 0`; sink `PORT=45103 node $S/qs/sink.mjs`; drive with `curl -s http://127.0.0.1:45107/db2fresh`; no-orchestrion arm `node build-noorch.mjs; npx wrangler dev --config wrangler-noorch.jsonc --port 45109 --inspector-port 0`. node_modules is left in place; recreate with `npm install $S/pack/sentry-{cloudflare,core,server-utils,opentelemetry}-10.67.0.tgz @nestjs/core@11 @nestjs/common@11 @nestjs/platform-express@11 express rxjs reflect-metadata mysql mysql2 esbuild typescript wrangler@4`. All started processes were killed; ports 45103/45107/45109/45111 verified free.

## Workaround

Use mysql2 with `disableEval: true` in the connection/pool options (`mysql2.createConnection({ host, port, user, database, disableEval: true })`); without it workerd throws `EvalError: Code generation from strings disallowed for this context` from mysql2's generated row parsers. Open the connection inside the request handler rather than at module scope: a module-scope pool either fails with "Cannot perform I/O on behalf of a different request" (mysql2) or adds a silent ~10s per request (mysql@2). Spans are unaffected by where the connection is created because the orchestrion esbuild/Vite plugin injects the diagnostics channel at build time.

## Docs impact

On Cloudflare Workers, `db` spans require the build-time orchestrion transform (`sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild`, or `sentryCloudflareVitePlugin()`'s `buildTimeInstrumentation` for Vite builds) and work with both `mysql@2` and `mysql2` — for `mysql2` you must pass `disableEval: true` in the connection options, since workerd forbids code generation from strings — and the connection must be created inside the request handler, not at module scope, because workerd forbids reusing a socket across requests.
