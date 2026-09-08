# verify4-M-nuxt-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-nuxt-bun` (see `$REPRO/cells/M-nuxt-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app.pid`, `build-bun-nuxtsdk.log`, `build-bunsdk.log`, `build-external.log`, `build-nodeserver.log`, `build-nuxt-static.log`, `install-mysql2x.log`, `install.log`, `install2.log`, `run-b/`, `run-bunsdk.log`, `run-external.log`, `run-nodeserver-bun.log`, `run-nodeserver-node.log`, `run-nuxt-static.log`, `run-nuxtsdk-stream.log`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Refuted on both halves of the report. Under the DOCUMENTED wiring (`import * as Sentry from '@sentry/nuxt'`, sdk stays `sentry.javascript.nuxt`), Nuxt 4.5.2 on bun 1.4.0 with `NITRO_PRESET=bun` produces fully attributed db spans nested under the request span, and the mysql2 query does NOT have to fail. Two independent, separately provable causes were behind the "partial":

CAUSE 1 - the missing parent span, not missing instrumentation. `@sentry/server-utils` mysql2 subscriber binds its channels with `{ requiresParentSpan: true }` (worktree packages/server-utils/src/integrations/mysql2/mysql2-dc-subscriber.ts:125 and :144). On bun, `@sentry/nuxt` alone creates no `http.server` span (the h3 patch logs only "Patched h3 event handler. Created new isolation scope."), so every mysql2 span is suppressed. Adding `integrations: [bunServerIntegration()]` (imported from `@sentry/bun`, init still from `@sentry/nuxt`) restores the parent and the db spans appear. Proof that instrumentation was never absent: the `mysql` v2 driver (which the repo's own e2e app nuxt-4/server/api/db-mysql.ts uses) has NO `requiresParentSpan`, and under plain `@sentry/nuxt` on bun it already emitted a complete span - as its own root transaction:
  {"name":"SELECT id, name FROM users WHERE id > 0","info":{"source":"custom"},"trace":{"op":"db","origin":"auto.db.mysql","data":{"db.system.name":"mysql","db.namespace":"app","db.query.text":"SELECT id, name FROM users WHERE id > 0","db.query.summary":"SELECT users","server.address":"127.0.0.1","server.port":3307}}}
That also refutes "the build-time orchestrion pass injected nothing": with a driver that needs injection present, `grep -o "orchestrion:[a-z0-9:._-]*" .output/server/index.mjs` -> `orchestrion:mysql:query`, and the boot log shows `[instrumentation:mysql] Bun/Deno, subscribing eagerly`. The earlier "injected libraries=[]" was an artifact of the app only using mysql2, which publishes its own channels and needs no injection.

CAUSE 2 - `genFunc$1 is not a function` is a Nitro bundling bug with a one-line fix, not an unfixable blocker. `nitro: { externals: { external: ['mysql2', 'mysql2/promise'] } }` keeps mysql2 out of the rollup bundle; the query then returns rows on the first try (`[warmdb] mysql2 ok`, `{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}`). Confirmed the bug is Nitro's, not bun's or Sentry's: the same unexternalized build on `node-server` under plain node fails the same way, and there it also breaks the `mysql` v2 driver (`TypeError: SqlString.format is not a function`) which bun happens to tolerate.

FINAL WORKING RUN, documented wiring, static lifecycle (variant F, $REPRO/refutations/verify4-M-nuxt-bun-dbspans/run-b/app-F.log):
  {"type":"transaction","name":"GET /api/db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.nuxt","spans":["db mysql2.pool.connect","db SELECT id, name FROM users WHERE id > ?"],"spanDetail":[{"op":"db","desc":"mysql2.pool.connect","origin":"auto.db.mysql2.diagnostic_channel","db_ns":"app"},{"op":"db","desc":"SELECT id, name FROM users WHERE id > ?","origin":"auto.db.mysql2.diagnostic_channel","db_text":"SELECT id, name FROM users WHERE id > ?","db_summary":"SELECT users","db_ns":"app"}]}
  {"type":"transaction","name":"GET /api/dbmysql","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.nuxt","spans":["db SELECT id, name FROM users WHERE id > 0"],"spanDetail":[{"op":"db","desc":"SELECT id, name FROM users WHERE id > 0","origin":"auto.db.mysql","db_text":"SELECT id, name FROM users WHERE id > 0","db_summary":"SELECT users","db_ns":"app"}]}

OTHER TRACE LIFECYCLE - stream (the develop default, variant G, run-b/app-G.log): same result, db spans parented to the Bun.serve segment, low-cardinality names:
  {"type":"span","trace_id":"378df42b...","items":["db mysql2.pool.connect","db SELECT users","http.server GET"],"raw":[{"name":"SELECT users","parent_span_id":"afcc488535e06f05","is_segment":false,"origin":"auto.db.mysql2.diagnostic_channel","op":"db","db_text":"SELECT id, name FROM users WHERE id > ?","db_summary":"SELECT users","db_ns":"app"},{"name":"GET","is_segment":true,"origin":"auto.http.bun.serve","op":"http.server"}]}
  {"type":"span","trace_id":"f43c68b5...","items":["db SELECT users","http.server GET"],"raw":[{"name":"SELECT users","parent_span_id":"b1313fbd37da1d4c","origin":"auto.db.mysql","op":"db","db_text":"SELECT id, name FROM users WHERE id > 0","db_summary":"SELECT users","db_ns":"app"}]}

NEW GOTCHA FOUND (bundler variant E, run-b/app-E.log): on bun, externalizing is driver-dependent. With `external: ['mysql','mysql2','mysql2/promise']`, mysql2 still gets spans (it publishes its own channels and the SDK subscribes eagerly) but `mysql` v2 gets NONE - `{"name":"GET /api/dbmysql","op":"http.server","spans":[]}` - because bun has no require hook ("No available Node API to register diagnostics-channel injection hooks; skipping") and an external module cannot receive the build-time orchestrion injection. So on bun: drivers that publish their own channels (mysql2) must be external; drivers that need Sentry's injection (mysql v2) must stay bundled.

VARIANTS RUN (all `NITRO_PRESET=bun npx nuxt build` + `PORT=51842 bun run .output/server/index.mjs`, sink `PORT=51841 node sink.mjs`, MariaDB 127.0.0.1:3307):
A @sentry/nuxt, no externals: mysql2 crashes genFunc$1, no mysql2 span; mysql v2 works, orphan root db span.
B @sentry/nuxt + externals[mysql2]: both queries succeed; mysql2 spans only under a manual `Sentry.startSpan` parent; mysql v2 orphan root span.
C @sentry/bun + externals[mysql2]: full nesting (the previously reported working variant).
D @sentry/nuxt, no externals, node-server preset under node: both drivers break in the bundle (genFunc$1 / SqlString.format), spans still recorded - proves the bundling bug is Nitro's.
E @sentry/bun + externals[mysql,mysql2]: mysql v2 loses its span (see gotcha).
F @sentry/nuxt + bunServerIntegration() + externals[mysql2], static: works.
G same as F, stream lifecycle: works.

Probe files (rerun after `npm install` per the package.json in app/, node_modules removed to save disk): $REPRO/refutations/verify4-M-nuxt-bun-dbspans/app/{nuxt.config.ts,sentry.server.config.ts,server/utils/dbpool.ts,server/utils/dbconn.ts,server/api/{db,dbmysql,dbspan,dbmysqlspan,sentinel}.ts,server/plugins/warmdb.ts}; logs in $REPRO/refutations/verify4-M-nuxt-bun-dbspans/run-b/; sink at $REPRO/refutations/verify4-M-nuxt-bun-dbspans/sink.mjs. app/ is left in the variant-F/G state. All processes killed.

## Workaround

Keep the documented `import * as Sentry from '@sentry/nuxt'` init and add two things. In sentry.server.config.ts: `import { bunServerIntegration } from '@sentry/bun'` and pass `integrations: [bunServerIntegration()]` to `Sentry.init` - the nitro `bun` preset serves through `Bun.serve`, which the Node-based Nuxt SDK does not instrument, and mysql2 spans are bound with `requiresParentSpan: true` so they are dropped without a request span. In nuxt.config.ts: `nitro: { externals: { external: ['mysql2', 'mysql2/promise'] } }` - bundling mysql2 through Nitro's rollup breaks the driver itself (`genFunc$1 is not a function`, and on node `SqlString.format is not a function` for mysql v2). Do not externalize drivers that rely on Sentry's build-time channel injection (`mysql` v2, and anything else without its own diagnostics channels): on bun there is no runtime require hook, so an external module of that kind is never instrumented.

## Docs impact

On the Nuxt guide's Bun/Nitro page: "When you deploy Nuxt with the Nitro `bun` preset, keep `Sentry.init` in `sentry.server.config.ts` importing from `@sentry/nuxt`, add `integrations: [bunServerIntegration()]` from `@sentry/bun` so requests served by `Bun.serve` get a span (database spans such as mysql2's are only recorded inside an active request span), and keep native database drivers out of the server bundle with `nitro: { externals: { external: ['mysql2', 'mysql2/promise'] } }`, since Nitro's rollup bundling breaks those drivers at runtime; do not externalize drivers that have no diagnostics channels of their own (for example `mysql` v2), because Bun cannot install the runtime instrumentation hook and only bundled code receives build-time instrumentation."
