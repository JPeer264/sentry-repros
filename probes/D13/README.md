# D13 — Hono on Deno with the hook and a database

Runtime: Deno 2.9.0. SDK: `@sentry/hono` + `@sentry/deno` 10.67.0 (develop, `getsentry/sentry-javascript` @ `6f2da7483d`), installed from the tarballs in `_toolbox/pack`.

## What it reproduces

A Hono app on Deno wired through `@sentry/hono/deno` with `import "@sentry/deno/import"` as the first line of the entry and a module-scope `mysql` connection that is created before `sentry()` runs `init` (ESM hoisting). With `traceLifecycle: "static"`, `GET /users/1` produces one `http.server` transaction named `GET /users/:id` (source `route`, origin `auto.http.deno`) whose single child `db` span (origin `auto.db.mysql`, `db.system.name` mysql, `db.query.summary` `SELECT users`) has `parent_span_id` equal to the transaction's `span_id`, so the import hook instruments the database driver even though the connection predates `init`. The error thrown in the `GET /error` route is captured as an unhandled `auto.http.hono.context_error` event with sdk `sentry.javascript.hono`, linked to the `GET /error` transaction by the same `trace_id`/`span_id` (status `internal_error`, HTTP 500), and carries context lines.

## Install

```
cd $REPRO/probes/D13 && npm install --no-audit --no-fund
```

## Run

```
D=$REPRO/probes/D13

PORT=41733 node $D/sink.mjs > $D/sink.log 2>&1 &
sinkpid=$!

cd $D && SINK_PORT=41733 PORT=41734 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys $D/main.ts > $D/app.log 2>&1 &
apppid=$!

node $D/drive.mjs 41734 41733 | tee $D/drive.out    # /users/1, /error, /sentinel, then dump the sink
curl -s http://127.0.0.1:41733/__raw > $D/raw.json

kill $apppid; wait $apppid; kill $sinkpid; wait $sinkpid
```

Requires the MariaDB container on `127.0.0.1:3307` (user `root`, no password, database `app`, table `users`).

## Expected

Recorded verdict: **works**.

Hono app on Deno 2.9.0 via `@sentry/hono/deno` with `import "@sentry/deno/import"` first and a module-scope `mysql` connection created before `Sentry.init` ran. With `traceLifecycle` static, `GET /users/1` produced one `http.server` transaction named `GET /users/:id` (source route, origin `auto.http.deno`) whose single child `db` span (origin `auto.db.mysql`, `db.system.name` mysql, `db.query.summary` `SELECT users`) has `parent_span_id` equal to the transaction's `span_id`. The thrown route error was captured as an unhandled `auto.http.hono.context_error` event, sdk `sentry.javascript.hono`, linked to the `GET /error` transaction (same trace_id/span_id, status `internal_error`, HTTP 500), with context lines.

Recorded evidence lines:

```
drive2.out:
/users/1 200 [{"id":1,"name":"ada"}]
/error 500 Internal Server Error
/sentinel 200 ok
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"26aa20bddce54cdc9e30a1848ed46780","span_id":"96af83205deec3b5","origin":"auto.http.deno","spans":[{"op":"db","description":"SELECT id, name FROM users WHERE id = ?","span_id":"bf6178bf2e893198","parent_span_id":"96af83205deec3b5","origin":"auto.db.mysql","status":"ok"}]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"d6f4e6f140aa46b7a6db9307d35ea00d","span_id":"8c84df6270dbf57a","origin":"auto.http.deno","spans":[]}
{"type":"event","exception":"route boom","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":{"name":"deno","version":"2.9.0"},"transaction":"GET /error","trace_id":"d6f4e6f140aa46b7a6db9307d35ea00d","span_id":"8c84df6270dbf57a","request_url":"http://127.0.0.1:41734/error","hasContextLine":true}
{"type":"event","message":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.hono","transaction":"GET /sentinel"}

raw2.json db span data:
{"sentry.origin":"auto.db.mysql","sentry.op":"db","sentry.kind":"client","db.system.name":"mysql","db.connection_string":"jdbc:mysql://127.0.0.1:3307/app","db.namespace":"app","db.user":"root","db.query.text":"SELECT id, name FROM users WHERE id = ?","db.query.summary":"SELECT users","server.address":"127.0.0.1","server.port":3307}
raw2.json transaction data (GET /users/:id): "http.route":"/users/:id","http.response.status_code":200,"sentry.segment.name.source":"route"

app2.log:
Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [hono] Patched app.request for internal dispatch tracing.
PORT=41734
```

## Observed on 2026-09-07

Matches the recorded verdict.

`drive.out`:

```
/users/1 200 [{"id":1,"name":"ada"}]
/error 500 Internal Server Error
/sentinel 200 ok
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"a0a6134df64c4e7d9a264332cb2ffef4","span_id":"b9a23e97d6ef8622","origin":"auto.http.deno","spans":[{"op":"db","description":"SELECT id, name FROM users WHERE id = ?","span_id":"a08e54ba40f9a9ae","parent_span_id":"b9a23e97d6ef8622","origin":"auto.db.mysql","status":"ok"}]}
{"type":"event","exception":"route boom","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":{"name":"deno","version":"2.9.0"},"transaction":"GET /error","trace_id":"d11f836996cb40ceacf2da84423b370a","span_id":"b24fd79954bf1449","request_url":"http://127.0.0.1:41734/error","hasContextLine":true}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"d11f836996cb40ceacf2da84423b370a","span_id":"b24fd79954bf1449","origin":"auto.http.deno","spans":[]}
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.hono","runtime":{"name":"deno","version":"2.9.0"},"transaction":"GET /sentinel","trace_id":"e971c5c9539040a1843946135728ae19","span_id":"934fbc25b4e8ebd4","request_url":"http://127.0.0.1:41734/sentinel","hasContextLine":true}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","trace_id":"e971c5c9539040a1843946135728ae19","span_id":"934fbc25b4e8ebd4","origin":"auto.http.deno","spans":[]}
```

`raw.json` db span data (the child of the `GET /users/:id` transaction):

```
{"sentry.origin":"auto.db.mysql","sentry.op":"db","sentry.kind":"client","db.system.name":"mysql","db.connection_string":"jdbc:mysql://127.0.0.1:3307/app","db.namespace":"app","db.user":"root","db.query.text":"SELECT id, name FROM users WHERE id = ?","db.query.summary":"SELECT users","server.address":"127.0.0.1","server.port":3307}
```

`raw.json` transaction data (`GET /users/:id`), trimmed:

```
"sentry.origin":"auto.http.deno","sentry.op":"http.server","sentry.segment.name.source":"route","http.route":"/users/:id","http.response.status_code":200
```

`app.log`, trimmed to the lines that carry the verdict:

```
Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:mysql] subscribing to channels
Sentry Logger [log]: [hono] Patched app.request for internal dispatch tracing.
Listening on http://0.0.0.0:41734/ (http://localhost:41734/)
PORT=41734
```

Only difference from the recorded excerpt: this sink also prints `exception`, `runtime`, `trace_id`,
`span_id` and `request_url` on the `sentinel` message event, and the `GET /sentinel` transaction that
the recorded excerpt trimmed away. The `"exception":"sentinel"` field on that event is the synthetic
stacktrace carrier from the default `attachStacktrace: true`, not a captured error. No behavioral
difference.

## Files

- `main.ts` - Hono app on Deno: `import "@sentry/deno/import"` first, module-scope `mysql` connection, `sentry()` middleware with `traceLifecycle: "static"`, routes `/users/:id`, `/error`, `/sentinel`
- `drive.mjs` - drives the three routes from a plain node process, waits for the sentinel event, dumps the sink
- `sink.mjs` - envelope sink, extended over `_toolbox/sink.mjs` with `span_id`/`parent_span_id`/`origin` on transactions and their child spans and a `/__raw` endpoint
- `deno.json` - `nodeModulesDir: "manual"`
- `drive.out`, `app.log`, `sink.log`, `raw.json` - output of the run on 2026-09-07
