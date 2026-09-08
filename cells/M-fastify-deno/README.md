# M-fastify-deno — Fastify 5.12.3 on Deno 2.9.0, @sentry/deno 10.67.0 (develop)

## What it reproduces

Fastify 5 runs unchanged on Deno, and the develop `@sentry/deno` SDK (10.67.0, built from
`getsentry/sentry-javascript` at `6f2da7483d`) instruments it with **no import hook and no bundler
step**: request spans carry the parameterized route name, thrown handler errors arrive with
mechanism `auto.function.fastify`, per-request scope isolation holds under concurrency, incoming
`sentry-trace`/`baggage` continues the trace, module-scope `mysql2` pool queries produce `db` spans,
and `Sentry.logger` calls arrive as `log` envelopes correlated to the request trace. The single
failure is outgoing **global `fetch()`**: no `http.client` span and no propagation headers (Deno-wide
gap K2); a `node:http` request from the same handler does get both. The `@sentry/deno/import` hook
must **not** be added — with it, Fastify dies at import time on `require("./refs/data.json")` inside
`ajv` (Deno bug K3, denoland/deno#36240); `main-hook.ts` demonstrates that failure.

## Install

```
cd $REPRO/cells/M-fastify-deno
npm install --no-audit --no-fund
```

(`package.json` points at the develop tarballs in `../../_toolbox/pack/`. Equivalent explicit form:
`npm install --no-audit --no-fund ../../_toolbox/pack/sentry-deno-10.67.0.tgz ../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz fastify@5 mysql2@3`)

Needs MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users`) for `/db`.

## Run

```
cd $REPRO/cells/M-fastify-deno

# 0. viability without Sentry
APP_PORT=53370 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys bare.ts &
curl -s http://127.0.0.1:53370/users/42

# 1. sink (47021) + downstream header recorder (41339)
PORT=47021 RAW=$PWD/raw-a.ndjson node sink.mjs > sink.log 2>&1 &  sink=$!
PORT=41339 node recorder.mjs > recorder.log 2>&1 &  rec=$!

# 2. app, static lifecycle (transaction envelopes with nested spans[])
LIFECYCLE=static APP_PORT=47022 SINK_PORT=47021 RECORDER_PORT=41339 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app-static.log 2>&1 &  app=$!

curl -s -X DELETE http://127.0.0.1:47021/__items
curl -s http://127.0.0.1:47022/users/42
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:47022/error
curl -s http://127.0.0.1:47022/db
curl -s http://127.0.0.1:47022/downstream
curl -s http://127.0.0.1:47022/iso/alpha & curl -s http://127.0.0.1:47022/iso/bravo & curl -s http://127.0.0.1:47022/iso/charlie & wait
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1234567890abcdef-1' \
        -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1' \
        http://127.0.0.1:47022/users/7
curl -s http://127.0.0.1:47022/log
curl -s http://127.0.0.1:47022/sentinel                 # sentinel gate for events/spans
curl -s http://127.0.0.1:47021/__items | python3 -m json.tool
# logs flush on a ~5s timer: poll /__items for a `"log"` item before reading (see step 2b)

# 2b. log envelope on its own (needs the app alive ~5s after the request)
LIFECYCLE=static APP_PORT=47024 SINK_PORT=47021 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app-log2.log 2>&1 &
curl -s http://127.0.0.1:47024/log
for i in $(seq 1 15); do sleep 1; curl -s http://127.0.0.1:47021/__items | grep -q '"log"' && break; done
curl -s http://127.0.0.1:47021/__items | python3 -m json.tool

# 3. default stream lifecycle: same command without LIFECYCLE=static
APP_PORT=47026 SINK_PORT=47021 RECORDER_PORT=41339 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app-stream.log 2>&1 &

# 4. fetch vs node:http
APP_PORT=47025 SINK_PORT=47021 RECORDER_PORT=41339 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main2.ts > app-main2.log 2>&1 &
curl -s http://127.0.0.1:47025/nodehttp
curl -s http://127.0.0.1:47025/fetch2
curl -s http://127.0.0.1:41339/__seen | python3 -m json.tool

# 5. import-hook failure (K3)
APP_PORT=47029 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-hook.ts

kill $app; wait $app; kill $sink; wait $sink; kill $rec; wait $rec
```

## Expected (recorded verdict)

| capability | recorded verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** (Deno K2: no `http.client` span, no headers; `node:http` works) |
| db spans | works |
| logs | works |

Recorded evidence lines:

```
READY http://127.0.0.1:53370
$ curl -s http://127.0.0.1:53370/users/42  ->  {"id":"42"}

{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"5c67f86690254dfd9736cdc8e3b4b22d","route":"/users/:id","spans":["handler GET /users/:id","handler fastify - route-handler"]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"0244f4a397474216bc99540015aee2c6","route":"/error","spans":["handler GET /error","handler fastify - route-handler"]}
{"type":"event","exception":"fastify route boom","mechanism":"auto.function.fastify","handled":false,"sdk":"sentry.javascript.deno","trace_id":"0244f4a397474216bc99540015aee2c6","parent_span_id":"a54d462cf43a4ab7","transaction":"GET /error","hasContextLine":true}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"c941e25e5ed94ac9bd60f7f5d4e81678","route":"/db","spans":["handler GET /db","handler fastify - route-handler","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","trace_id":"abce2900ed36428285d2ecb8208a41a9","route":"/downstream","spans":["handler GET /downstream","handler fastify - route-handler"]}   <-- no http.client span for fetch

{"type":"event","exception":"iso error bravo","tags":{"probe_tag":"bravo"},"trace_id":"0cb202dcb1ed41b08de58126ba377e98","parent_span_id":"b90860a13663e04b","transaction":"GET /iso/:tag"}
{"type":"event","exception":"iso error alpha","tags":{"probe_tag":"alpha"},"trace_id":"d229924697b346ceb55a387dd04c5100","parent_span_id":"83cfa4c0d113338d","transaction":"GET /iso/:tag"}
{"type":"event","exception":"iso error charlie","tags":{"probe_tag":"charlie"},"trace_id":"8f657c82a19649d092e884233a66c794","parent_span_id":"bcaf30255fd145f7","transaction":"GET /iso/:tag"}
{"type":"transaction","name":"GET /iso/:tag","source":"route","trace_id":"0cb202dcb1ed41b08de58126ba377e98","tags":{"probe_tag":"bravo"}}

{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"1234567890abcdef","route":"/users/:id"}
{"type":"log","items":["info: hello from fastify on deno trace=69b2bc98432b4a0e876c9d72357ec2db"]}

{"type":"span","items":["handler | /users/:id | trace=03a1511f8c72454ca0bfa17ccafbef54 parent=96aeacc4ba786e8c src=- route=/users/:id","handler | /users/:id | ...","http.server | GET /users/:id | trace=03a1511f8c72454ca0bfa17ccafbef54 parent=- src=- route=/users/:id"]}
```

## Observed on 2026-09-07

Rebuilt and run once. **Matches the record on all seven capabilities.** Fastify resolved to exactly
5.12.3, mysql2 3.24.3, `@sentry/deno` 10.67.0.

Viability, bare Fastify with no Sentry (`bare.log`):

```
READY http://127.0.0.1:53370
$ curl -s http://127.0.0.1:53370/users/42  ->  {"id":"42"}
```

`traceLifecycle: 'static'` — routes, errors, db, downstream fetch (sink `/__items`):

```
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "189aa981653e4b5daed47955b221e1da", "route": "/users/:id", "spans": ["handler GET /users/:id", "handler fastify - route-handler"]}
{"type": "transaction", "name": "GET /error", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "40769964eeb64b38a34dbc4dbf4d7d2a", "route": "/error", "spans": ["handler GET /error", "handler fastify - route-handler"]}
{"type": "event", "exception": "Error: fastify route boom", "mechanism": "auto.function.fastify", "handled": false, "sdk": "sentry.javascript.deno", "runtime": "deno", "hasContextLine": true, "transaction": "GET /error", "trace_id": "40769964eeb64b38a34dbc4dbf4d7d2a", "parent_span_id": "bd96fb74a007f865"}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "7e564c778da343a0994689acf30eb0e4", "route": "/db", "spans": ["handler GET /db", "handler fastify - route-handler", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /downstream", "op": "http.server", "source": "route", "status": "ok", "trace_id": "01420c5232864db1866a64ad1a8ff488", "route": "/downstream", "spans": ["handler GET /downstream", "handler fastify - route-handler"]}
```

(`GET /error` returned HTTP 500 to the client, as recorded.)

Isolation, 3 concurrent `/iso/:tag`:

```
{"type": "event", "exception": "Error: iso error alpha", "mechanism": "generic", "handled": true, "transaction": "GET /iso/:tag", "trace_id": "f8f58c4445c048378d0bb3821d85fe6a", "parent_span_id": "9a670d02965dbe7e", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso error bravo", "mechanism": "generic", "handled": true, "transaction": "GET /iso/:tag", "trace_id": "fb3d0de0e1bd4370a259b3a1b6720102", "parent_span_id": "9b4d5048b5d6349d", "tags": {"probe_tag": "bravo"}}
{"type": "event", "exception": "Error: iso error charlie", "mechanism": "generic", "handled": true, "transaction": "GET /iso/:tag", "trace_id": "6e67c325999f43a2b86647f495e82bbb", "parent_span_id": "b704d099021a77c7", "tags": {"probe_tag": "charlie"}}
{"type": "transaction", "name": "GET /iso/:tag", "op": "http.server", "source": "route", "status": "ok", "trace_id": "f8f58c4445c048378d0bb3821d85fe6a", "route": "/iso/:tag", "tags": {"probe_tag": "alpha"}, "spans": ["handler GET /iso/:tag", "handler fastify - route-handler"]}
```

Incoming trace:

```
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "1234567890abcdef", "route": "/users/:id", "spans": ["handler GET /users/:id", "handler fastify - route-handler"]}
```

Logs (arrived 5s after the request; trace id equals the `/log` transaction's):

```
{"type": "transaction", "name": "GET /log", "op": "http.server", "source": "route", "status": "ok", "trace_id": "2528ebc85c0f4009a5e677f9faf02093", "route": "/log", "spans": ["handler GET /log", "handler fastify - route-handler"]}
{"type": "log", "items": ["info: hello from fastify on deno"]}
raw: info hello from fastify on deno trace= 2528ebc85c0f4009a5e677f9faf02093 attrs= {'route': '/log', 'sentry.trace.parent_span_id': 'a070e04493aa2345'}
```

Default `traceLifecycle: 'stream'` — same route names, `http.route` present, `db` spans present, still no `http.client` for `fetch`:

```
{"type": "span", "items": ["handler | /users/:id | trace=8d0b63ca282241c3b1d011337eb3040d parent=a75d5ebb8da45500 src=- route=/users/:id", "handler | /users/:id | trace=8d0b63ca282241c3b1d011337eb3040d parent=ae0b81cba5103813 src=- route=/users/:id", "http.server | GET /users/:id | trace=8d0b63ca282241c3b1d011337eb3040d parent=- src=- route=/users/:id"]}
{"type": "span", "items": ["db | mysql2.pool.connect | trace=fdb5493686a8460baa9bf42b9b4bbabf parent=891bae35cd172afe src=- route=-", "db | mysql2.connect | trace=fdb5493686a8460baa9bf42b9b4bbabf parent=98c3b96adf1e218e src=- route=-", "db | SELECT users | trace=fdb5493686a8460baa9bf42b9b4bbabf parent=891bae35cd172afe src=- route=-", "handler | /db | ... route=/db", "http.server | GET /db | trace=fdb5493686a8460baa9bf42b9b4bbabf parent=- src=- route=/db"]}
{"type": "span", "items": ["handler | /downstream | ... route=/downstream", "handler | /downstream | ... route=/downstream", "http.server | GET /downstream | trace=df32c1b07d924849a091448ac1c405d8 parent=- src=- route=/downstream"]}
```

`fetch` vs `node:http` (`main2.ts`, recorder `/__seen`):

```
{"type": "span", "items": ["http.client | GET 127.0.0.1 | trace=ab0cc3c9e1b54c98bdab9773ccbf1b2a parent=9d2bc0638b680c42 src=- route=-", "handler | /nodehttp | ... route=/nodehttp", "http.server | GET /nodehttp | trace=ab0cc3c9e1b54c98bdab9773ccbf1b2a parent=- src=- route=/nodehttp"]}
{"type": "span", "items": ["handler | /fetch2 | ... route=/fetch2", "handler | /fetch2 | ... route=/fetch2", "http.server | GET /fetch2 | trace=45cfaf6dbc044d9ea005614c59ecdd79 parent=- src=- route=/fetch2"]}

[{"url":"/from-fetch",     "headers":{"sentry-trace":null,"baggage":null}},
 {"url":"/from-fetch",     "headers":{"sentry-trace":null,"baggage":null}},
 {"url":"/from-nodehttp",  "headers":{"sentry-trace":"ab0cc3c9e1b54c98bdab9773ccbf1b2a-8865319493ca0015-1","baggage":"sentry-environment=production,sentry-release=m-fastify-deno%401,...,sentry-trace_id=ab0cc3c9e1b54c98bdab9773ccbf1b2a,sentry-transaction=GET%20%2Fnodehttp,sentry-sampled=true,..."}},
 {"url":"/from-fetch2",    "headers":{"sentry-trace":null,"baggage":null}}]
```

K3, import hook added (`main-hook.ts`), exit code 1, server never starts:

```
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const $dataRefSchema = require("./refs/data.json");
                       ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    ...
    at Object.<anonymous> (.../node_modules/ajv/dist/core.js:21:24)
```

Per-capability comparison:

| capability | recorded | observed 2026-09-07 | match |
| --- | --- | --- | --- |
| errors | works | works | yes |
| route names | works | works | yes |
| isolation | works | works | yes |
| incoming trace | works | works | yes |
| outgoing fetch | broken | broken (identical: no span, both headers null; `node:http` fine) | yes |
| db spans | works | works | yes |
| logs | works | works | yes |

Only cosmetic differences, all from the sink's own formatting rather than the SDK: the exception
strings here are printed with their type prefix (`Error: fastify route boom` vs the record's
`fastify route boom`), and this sink's `log` line does not append the trace id to the body (the raw
payload line above shows the same correlation the record reported).
