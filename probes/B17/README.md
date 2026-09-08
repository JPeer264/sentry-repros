# B17 — mysql2 driver on Bun with the plugin build

Runtime: `bun` 1.4.0 · SDK: `develop` tarballs at 10.67.0 (`_toolbox/pack/*.tgz`) · mysql2 3.24.3 ·
MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users`) · Recorded verdict: **works**

## What it reproduces

A `Bun.serve` app bundled with `sentryBunPlugin()` (`@sentry/bun/plugin`, `target: "bun"`,
`external: ["@sentry/*"]`) that queries MariaDB through `mysql2/promise`, driven by a plain `node`
process against a local envelope sink. Four shapes run off the same bundle: a module-scope
`createPool` in the default `stream` lifecycle and in `static`, a per-request `createConnection`
whose `import mysql from "mysql2/promise"` sits at the top of the entry, and the same per-request
connection created after `await import("mysql2/promise")` inside the route handler. The first three
produce `db` spans with `db.system.name=mysql`, `db.query.text="SELECT * FROM users"`,
`db.namespace=app`, `server.address`/`server.port` and origin
`auto.db.mysql2.diagnostic_channel` — named by the low-cardinality summary `SELECT users` in stream
mode, kept as the full statement in the `static` transaction's child span. The fourth is the K11
shape: the dynamic import inside the handler yields no db span at all, only `http.server GET /db`,
even though the bundle contains the injected `mysql2:query`/`mysql2:connect` channel code.

## Install

```sh
cd $REPRO/probes/B17 && npm install --no-audit --no-fund
```

(`package.json` points at the mirrored develop tarballs in `../../_toolbox/pack/`. `dist/` is
checked in, so no rebuild is needed; `bun run build.ts` regenerates it.)

## Run

From this directory. The sink port below is arbitrary; pick a free one.

```sh
PORT=52847 RAW=$PWD/raw.log node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
./run.sh dist/app.js 52847 pool-stream                   # module-scope pool, default (stream) lifecycle
./run.sh dist/app.js 52847 pool-static static            # module-scope pool, traceLifecycle: 'static'
./run.sh dist/app-perreq-static.js 52847 perreqstatic-stream   # per-request connection, top-level import
./run.sh dist/app-perreq.js 52847 perreq-stream          # per-request connection, dynamic import in handler (K11)
kill $spid; wait $spid

grep -o -E 'mysql2:(connect|execute|pool:connect|query)' dist/app-perreq.js | sort -u   # bundle transform check
```

`run.sh` starts `SINK_PORT=<sink> LIFECYCLE=<lc> PORT=0 bun <entry>`, waits for the `PORT=` line the
app prints, then runs `node drive.mjs <appPort> <sinkPort>`: it clears the sink, hits `/db`, hits
`/sentinel` (which calls `Sentry.captureMessage('sentinel')`) and polls `/__items` until the sentinel
event has arrived, repeats both, waits 7s, and dumps the sink items. Results land in
`drive-<label>.log`; the app's own stdout in `app-<label>.log`.

For the debug lines:

```sh
PORT=52847 node sink.mjs > sink.log 2>&1 & spid=$!
SENTRY_DEBUG=1 SINK_PORT=52847 PORT=0 bun dist/app-perreq.js > perreq-debug.log 2>&1 & apid=$!
# read the port from perreq-debug.log, curl /db, then
kill $apid; wait $apid; kill $spid; wait $spid
```

Files: `instrument.ts` (Sentry init, imported first), `app.ts` (module-scope pool),
`app-perreq-static.ts`, `app-perreq.ts`, `build.ts` (Bun.build with `sentryBunPlugin`),
`sink.mjs` (envelope sink, extended with a `dbSpans` field carrying the full attributes of every
`sentry.op=db` span), `drive.mjs` (plain-node driver), `run.sh`.

## Expected

Recorded verdict: **works**.

With `mysql2/promise` `createPool` at module scope and the `sentryBunPlugin` bundle, `GET /db`
produces db spans with `db.system.name=mysql`, `db.query.text="SELECT * FROM users"`,
`db.namespace=app`, `server.address`/`server.port`, origin `auto.db.mysql2.diagnostic_channel`; in
the default stream lifecycle the span is named by the low-cardinality summary `SELECT users` (plus
`mysql2.pool.connect` and, on the first request, `mysql2.connect`), with `traceLifecycle: 'static'`
the transaction `GET /db` carries child spans `db SELECT * FROM users`. K11 applies to mysql2 too,
but only for the dynamic-import shape: a per-request `createConnection` with a static top-level
`import mysql from "mysql2/promise"` still yields db spans, whereas `await import("mysql2/promise")`
inside the route handler yields no db span at all.

Recorded evidence lines:

```
pool, default (stream) lifecycle, sink item:
{"type":"span","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET /db"],"dbSpans":[...,{"name":"SELECT users","attributes":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307,"sentry.trace_lifecycle":"stream","sentry.segment.name":"GET /db","sentry.sdk.name":"sentry.javascript.bun","sentry.sdk.version":"10.67.0"}}]}
second /db (pool warm): {"type":"span","items":["db mysql2.pool.connect","db SELECT users","http.server GET /db"]}

pool, traceLifecycle: 'static':
transaction: GET /db  ["db mysql2.pool.connect","db mysql2.connect","db SELECT * FROM users"]
   db: {"op":"db","description":"SELECT * FROM users","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}

per-request createConnection, static top-level import (stream):
span:  ["db mysql2.connect","db SELECT users","http.server GET /db"]

per-request createConnection via await import("mysql2/promise") inside the handler (stream), K11:
{"type":"span","items":["http.server GET /db"],"dbSpans":[]}
{"type":"span","items":["http.server GET /sentinel"]}
(/db -> 200 [{"id":1,"name":"ada"},{"id":2,"name":"linus"}], both times)

bundle check: grep of dist/app-perreq.js shows the injected channel names "mysql2:connect"
"mysql2:execute" "mysql2:pool:connect" "mysql2:query".
debug log (SENTRY_DEBUG=1): "Sentry Logger [log]: [instrumentation:mysql2] Bun/Deno, subscribing
eagerly" / "Integration installed: Mysql2" in both the pool and the per-request runs.
```

## Observed on 2026-09-07

Rebuilt and run once. **Matches the recorded verdict** — `works`, in all four shapes, with the same
attribute set and the same K11 behavior.

pool, default (stream) lifecycle, `drive-pool-stream.log`:

```
/db (cold) -> 200 [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
/db (warm) -> 200 [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
{"type":"span","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET /db"],"dbSpans":[{"name":"mysql2.pool.connect","attributes":{...}},{"name":"mysql2.connect","attributes":{...}},{"name":"SELECT users","attributes":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307,"sentry.trace_lifecycle":"stream","sentry.segment.name":"GET /db","sentry.segment.id":"bd795f2b342be633","sentry.sdk.name":"sentry.javascript.bun","sentry.sdk.version":"10.67.0","sentry.environment":"production"}}]}
{"type":"span","items":["db mysql2.pool.connect","db SELECT users","http.server GET /db"],"dbSpans":[{"name":"mysql2.pool.connect",...},{"name":"SELECT users","attributes":{...same as above, sentry.segment.id":"96334042d2005a07"}}]}
{"type":"span","items":["http.server GET /sentinel"],"dbSpans":[]}
```

pool, `traceLifecycle: 'static'`, `drive-pool-static.log`:

```
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT * FROM users"],"dbSpans":[...,{"op":"db","description":"SELECT * FROM users","data":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}}]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["db mysql2.pool.connect","db SELECT * FROM users"],...}
```

per-request `createConnection` with a top-level import, `drive-perreqstatic-stream.log`:

```
{"type":"span","items":["db mysql2.connect","db SELECT users","http.server GET /db"],"dbSpans":[{"name":"mysql2.connect",...},{"name":"SELECT users","attributes":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307,...}}]}
```

per-request `createConnection` via `await import(...)` in the handler (K11),
`drive-perreq-stream.log`:

```
/db (cold) -> 200 [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
/db (warm) -> 200 [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
{"type":"span","items":["http.server GET /db"],"dbSpans":[]}
{"type":"span","items":["http.server GET /sentinel"],"dbSpans":[]}
{"type":"span","items":["http.server GET /db"],"dbSpans":[]}
{"type":"span","items":["http.server GET /sentinel"],"dbSpans":[]}
```

bundle check (`bundle-channels.txt`) and debug log (`perreq-debug.log`):

```
mysql2:connect
mysql2:execute
mysql2:pool:connect
mysql2:query

Sentry Logger [log]: [instrumentation:mysql2] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:mysql2] subscribing to channels
Sentry Logger [log]: Integration installed: Mysql2
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
```

Differences from the record: none of substance. Only fresh span/segment ids and a different sink
port (52847 instead of the recorded 47311, which was already taken on this machine), and the
`sentry.environment: "production"` attribute that the recorded excerpt trimmed away.
