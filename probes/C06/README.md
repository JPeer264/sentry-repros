# C06 — D1 locally (Cloudflare)

## What it reproduces

A plain `wrangler dev` Worker wrapped in `Sentry.withSentry` that uses its `env.DB` D1 binding
directly, with no manual instrumentation wrapper. Every D1 call path is exercised in one request
(`/d1`): `exec()`, `prepare().bind().run()`, `.all()`, `.first()` and `batch()`. Each one produces a
`db.query` span with origin `auto.db.cloudflare.d1` from the automatic `env` instrumentation. The app
runs in both trace lifecycles so the two span shapes can be compared: the default `stream` lifecycle
(`span` envelopes, span name is the low-cardinality query summary, full SQL in `db.query.text`) and
`traceLifecycle: 'static'` (`transaction` envelope whose child spans carry the full SQL as
`description`). It also shows which D1 calls get `cloudflare.d1.duration` / `rows_read` /
`rows_written` (only `run()` and `all()`, the ones that return a `D1Response` with `meta`) and that
`batch` adds `db.operation.batch.size` plus the joined statements in `db.query.text`.

SDK under test: `@sentry/cloudflare` 10.67.0 (develop, v11 line), installed from the tarballs in
`_toolbox/pack`.

## Install

```
cd $REPRO/probes/C06 && npm install
```

## Run

Sink (terminal 1):

```
cd $REPRO/probes/C06 && PORT=41337 node sink.mjs > sink.log 2>&1 &
```

Stream lifecycle (default):

```
cd $REPRO/probes/C06
npx wrangler dev --port 41338 --inspector-port 0 > app-stream.log 2>&1 &
# wait for "Ready on http://localhost:41338"
node drive.mjs 41338 41337 /d1 > run-stream.json
```

Static lifecycle:

```
npx wrangler dev --port 41338 --inspector-port 0 --var TRACE_LIFECYCLE:static > app-static.log 2>&1 &
# wait for "Ready on http://localhost:41338"
node drive.mjs 41338 41337 /d1 > run-static.json
```

`drive.mjs <appPort> <sinkPort> <path>` clears the sink, hits the path, then hits `/sentinel`
(which captures a `sentinel` message) and polls until that sentinel is in the sink, so nothing is
read before it has arrived. Read the results with the summarizers used below, or
`curl -s http://127.0.0.1:41337/__items`.

`rows_read` / `rows_written` / `first.n` grow across runs because the local miniflare D1 state in
`.wrangler/state` persists; only the presence of those attributes is the claim, not their values.

## Expected

Recorded verdict: **works**.

Recorded evidence:

```
Stream (default), span envelope for GET /d1:
{"name":"CREATE TABLE users","status":"ok","attributes":{"sentry.origin":"auto.db.cloudflare.d1","sentry.op":"db.query","db.system.name":"cloudflare-d1","db.operation.name":"exec","db.query.text":"CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)","db.query.summary":"CREATE TABLE users","sentry.trace_lifecycle":"stream","sentry.segment.name":"GET","sentry.sdk.version":"10.67.0"}}
{"name":"INSERT users","status":"ok","attributes":{"sentry.origin":"auto.db.cloudflare.d1","sentry.op":"db.query","db.system.name":"cloudflare-d1","db.operation.name":"run","db.query.text":"INSERT INTO users (name) VALUES (?)","db.query.summary":"INSERT users","cloudflare.d1.duration":0,"cloudflare.d1.rows_read":1,"cloudflare.d1.rows_written":2}}
{"name":"SELECT users","status":"ok","attributes":{"db.operation.name":"all","db.query.text":"SELECT id, name FROM users WHERE name = ?","db.query.summary":"SELECT users","cloudflare.d1.duration":0,"cloudflare.d1.rows_read":5,"cloudflare.d1.rows_written":0}}
{"name":"SELECT users","status":"ok","attributes":{"db.operation.name":"first","db.query.text":"SELECT COUNT(*) AS n FROM users","db.query.summary":"SELECT users"}}   (no cloudflare.d1.* attributes)
{"name":"D1 batch","status":"ok","attributes":{"sentry.origin":"auto.db.cloudflare.d1","sentry.op":"db.query","db.system.name":"cloudflare-d1","db.operation.name":"batch","db.query.text":"INSERT INTO users (name) VALUES (?)\nSELECT name FROM users WHERE name = ?","db.operation.batch.size":2}}
{"name":"GET","status":"ok","is_segment":true,"attributes":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","url.path":"/d1"}}
event sentinel

Static (--var TRACE_LIFECYCLE:static), transaction envelope:
transaction GET /d1 http.server auto.http.cloudflare ok
  {"op":"db.query","description":"CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)","origin":"auto.db.cloudflare.d1","status":"ok","data":{"db.operation.name":"exec","db.query.summary":"CREATE TABLE users"}}
  {"op":"db.query","description":"INSERT INTO users (name) VALUES (?)","origin":"auto.db.cloudflare.d1","status":"ok","data":{"db.operation.name":"run","cloudflare.d1.duration":0,"cloudflare.d1.rows_read":1,"cloudflare.d1.rows_written":2}}
  {"op":"db.query","description":"SELECT id, name FROM users WHERE name = ?","origin":"auto.db.cloudflare.d1","status":"ok","data":{"db.operation.name":"all","cloudflare.d1.rows_read":7,"cloudflare.d1.rows_written":0}}
  {"op":"db.query","description":"SELECT COUNT(*) AS n FROM users","origin":"auto.db.cloudflare.d1","status":"ok","data":{"db.operation.name":"first"}}
  {"op":"db.query","description":"D1 batch","origin":"auto.db.cloudflare.d1","status":"ok","data":{"db.operation.name":"batch","db.operation.batch.size":2}}
event sentinel
transaction GET /sentinel http.server auto.http.cloudflare ok
```

The record also notes that a second, manual wrap is not testable: `@sentry/cloudflare` on develop
exports no `instrumentD1` / `instrumentD1WithSentry`.

## Observed on 2026-09-07

Matches the recorded verdict (**works**).

Stream (default), `run-stream.json`, span envelopes for `GET /d1` (trimmed, attribute order as sent):

```
{"name": "CREATE TABLE users", "status": "ok", "is_segment": false, "attributes": {"sentry.origin": "auto.db.cloudflare.d1", "sentry.op": "db.query", "db.system.name": "cloudflare-d1", "db.operation.name": "exec", "db.query.text": "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)", "db.query.summary": "CREATE TABLE users", "sentry.trace_lifecycle": "stream", "sentry.segment.name": "GET", "sentry.sdk.version": "10.67.0"}}
{"name": "INSERT users", "status": "ok", "is_segment": false, "attributes": {"sentry.origin": "auto.db.cloudflare.d1", "sentry.op": "db.query", "db.system.name": "cloudflare-d1", "db.operation.name": "run", "db.query.text": "INSERT INTO users (name) VALUES (?)", "db.query.summary": "INSERT users", "cloudflare.d1.duration": 0, "cloudflare.d1.rows_read": 1, "cloudflare.d1.rows_written": 2}}
{"name": "SELECT users", "status": "ok", "is_segment": false, "attributes": {"sentry.origin": "auto.db.cloudflare.d1", "sentry.op": "db.query", "db.system.name": "cloudflare-d1", "db.operation.name": "all", "db.query.text": "SELECT id, name FROM users WHERE name = ?", "db.query.summary": "SELECT users", "cloudflare.d1.duration": 0, "cloudflare.d1.rows_read": 1, "cloudflare.d1.rows_written": 0}}
{"name": "SELECT users", "status": "ok", "is_segment": false, "attributes": {"sentry.origin": "auto.db.cloudflare.d1", "sentry.op": "db.query", "db.system.name": "cloudflare-d1", "db.operation.name": "first", "db.query.text": "SELECT COUNT(*) AS n FROM users", "db.query.summary": "SELECT users"}}
{"name": "D1 batch", "status": "ok", "is_segment": false, "attributes": {"sentry.origin": "auto.db.cloudflare.d1", "sentry.op": "db.query", "db.system.name": "cloudflare-d1", "db.operation.name": "batch", "db.query.text": "INSERT INTO users (name) VALUES (?)\nSELECT name FROM users WHERE name = ?", "db.operation.batch.size": 2}}
{"name": "GET", "status": "ok", "is_segment": true, "attributes": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server", "url.path": "/d1", "http.response.status_code": 200}}
event sentinel []
```

Static (`--var TRACE_LIFECYCLE:static`), `run-static.json`:

```
transaction GET /d1 http.server auto.http.cloudflare ok
  {"op": "db.query", "description": "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)", "origin": "auto.db.cloudflare.d1", "status": "ok", "data": {"db.operation.name": "exec", "db.query.summary": "CREATE TABLE users"}}
  {"op": "db.query", "description": "INSERT INTO users (name) VALUES (?)", "origin": "auto.db.cloudflare.d1", "status": "ok", "data": {"db.operation.name": "run", "db.query.summary": "INSERT users", "cloudflare.d1.duration": 0, "cloudflare.d1.rows_read": 1, "cloudflare.d1.rows_written": 2}}
  {"op": "db.query", "description": "SELECT id, name FROM users WHERE name = ?", "origin": "auto.db.cloudflare.d1", "status": "ok", "data": {"db.operation.name": "all", "db.query.summary": "SELECT users", "cloudflare.d1.duration": 0, "cloudflare.d1.rows_read": 3, "cloudflare.d1.rows_written": 0}}
  {"op": "db.query", "description": "SELECT COUNT(*) AS n FROM users", "origin": "auto.db.cloudflare.d1", "status": "ok", "data": {"db.operation.name": "first", "db.query.summary": "SELECT users"}}
  {"op": "db.query", "description": "D1 batch", "origin": "auto.db.cloudflare.d1", "status": "ok", "data": {"db.operation.name": "batch", "db.operation.batch.size": 2}}
event sentinel
transaction GET /sentinel http.server auto.http.cloudflare ok
```

`grep -o "instrumentD1[A-Za-z]*" node_modules/@sentry/cloudflare/build/esm/prod/index.js` returns
nothing, confirming the record's note that the manual D1 wrapper is not exported on develop.

Only difference from the record: the `cloudflare.d1.rows_read` values (1 and 3 here, 1/5 and 1/7 in
the record) and the `first` result differ, because the local D1 file starts empty in a fresh
reproduction and grows with each run. The attribute presence pattern, span names, ops, origins,
statuses, `db.query.summary` values and `db.query.text` values are identical.

## Files

- `src/index.ts` — the Worker, `withSentry` with `traceLifecycle` picked from the `TRACE_LIFECYCLE` var
- `wrangler.jsonc` — `nodejs_compat`, `compatibility_date` 2026-05-01, D1 binding `DB`
- `sink.mjs` — envelope sink, a copy of the toolbox sink extended to keep full span attributes,
  origin and status, plus transaction child-span `data`
- `drive.mjs` — drives one path and waits for the `sentinel` event
- `run-stream.json`, `run-static.json` — the sink items from the runs above
