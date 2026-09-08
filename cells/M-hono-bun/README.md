# M-hono-bun — Hono 4 with `@sentry/hono/bun` on Bun

## What it reproduces

A Hono 4 app served the Bun way (`export default { port, fetch: app.fetch }`) instrumented with the
single `sentry(app, { ... })` middleware from `@sentry/hono/bun` at 10.67.0 (the `develop` / v11 line),
run both unbundled (`bun app.ts`) and as a `Bun.build` bundle produced with `sentryBunPlugin`. It
exercises all seven server capabilities in one process: an error thrown inside a route handler, a
parameterized route name, per-request isolation across three concurrent requests, trace continuation
from an incoming `sentry-trace`/`baggage` pair, an outgoing `fetch` with propagated headers, database
spans from both a module-scope `mysql2@3` connection and a module-scope legacy `mysql@2` connection,
and a `Sentry.logger` line. The interesting part is the split between the two drivers: `mysql2@3`
publishes its own `node:diagnostics_channel` tracing channels, so it produces spans under plain
`bun app.ts`, while legacy `mysql@2` stays silent until the app is built with `sentryBunPlugin`.

## Install

```
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-hono-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  hono@4 mysql2@3 mysql@2
```

The same tarballs are mirrored in `$REPRO/_toolbox/pack/`.
Use `npm`, not `bun add` — `bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0`
dependencies; Bun reads the resulting `node_modules` fine. MariaDB must be reachable on
`127.0.0.1:3307` (user `root`, no password, database `app`, table `users`).

## Run

Everything runs from this directory. `run-unbundled.sh` and `run-bundled.sh` start their own envelope
sink (`sink2.mjs`, a copy of the toolbox sink extended with `http.route` and per-span trace ids) and a
header recorder (`recorder.mjs`), drive every route, wait for the `sentinel` event, dump
`items-*.json` / `hits-*.json`, and kill every process they started.

```
# baseline without Sentry
PORT=52179 bun baseline.ts          # GET /users/42 -> {"id":"42"}

# unbundled, traceLifecycle static (sink 52117, recorder 52182, app 52180)
bash run-unbundled.sh

# bundled with the Bun plugin, static and stream (app 52181)
bun run build.ts
bash run-bundled.sh
LIFECYCLE=stream bash run-bundled.sh
```

The scripts take `SINK`, `REC`, `APP` and `LIFECYCLE` from the environment if the default ports are
taken. Doing it by hand is the same thing spelled out:

```
PORT=52117 node sink2.mjs > sink.log 2>&1 &            sinkpid=$!
PORT=52182 node recorder.mjs > recorder.log 2>&1 &     recpid=$!
PORT=52180 SINK_PORT=52117 REC_PORT=52182 bun app.ts > app.log 2>&1 &  apppid=$!
curl -s http://127.0.0.1:52180/users/42
curl -s http://127.0.0.1:52180/boom
curl -s http://127.0.0.1:52180/iso/aaa & curl -s http://127.0.0.1:52180/iso/bbb & curl -s http://127.0.0.1:52180/iso/ccc &
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
        -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sample_rate=1" \
        http://127.0.0.1:52180/users/7
curl -s http://127.0.0.1:52180/fetchout ; curl -s http://127.0.0.1:52180/db
curl -s http://127.0.0.1:52180/dbold    ; curl -s http://127.0.0.1:52180/log
curl -s http://127.0.0.1:52180/sentinel                 # sentinel, then read the sink
curl -s http://127.0.0.1:52117/__items | python3 -m json.tool
curl -s http://127.0.0.1:52182/__hits  | python3 -m json.tool
kill $apppid $sinkpid $recpid
```

`dist/` is checked in so `bun dist/app.js` runs without a rebuild; `bun run build.ts` regenerates it.
Do not pass `external: ['@sentry/*']` to `Bun.build` here — it leaves `hono` inside the bundle and
`@sentry/hono` outside, so the Hono patches land on a different Hono copy.

## Expected

Recorded verdict (cell `M-hono-bun`, viable = yes): every capability **works** except `client errors`,
which is **not-run** (server-only app, no browser surface).

| capability | recorded verdict |
| --- | --- |
| errors | works — mechanism `auto.http.hono.context_error`, handled=false, transaction `GET /boom`, context lines, transaction `internal_error` |
| route names | works — `GET /users/:id`, `source: "route"`, `http.route: /users/:id`; no method-only fallback |
| isolation | works — three concurrent `GET /iso/:tag` requests keep their own tag and trace id, no cross-talk |
| incoming trace | works — `trace_id: aaaa…`, `parent_span_id: bbbbbbbbbbbbbbbb`; same in stream |
| outgoing fetch | works — child `http.client` span plus `sentry-trace` and full baggage on the wire |
| db spans | works — `mysql2@3` spans without a bundle; legacy `mysql@2` only after `Bun.build` with `sentryBunPlugin` |
| logs | works — `info: hono-bun-log-line` on the timer flush, no `enableLogs` option needed |
| client errors | not-run — no browser surface in this cell |

Recorded evidence lines:

```
UNBUNDLED (bun app.ts, traceLifecycle static):
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","trace_id":"414fb80f...","http_route":"/users/:id","spans":[]}
  {"type":"event","exception":"hono-bun-route-error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","transaction":"GET /boom","hasContextLine":true}
  {"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","http_route":"/boom"}

ISOLATION (3 concurrent requests, then sentinel):
  event iso-aaa tags= {'req-tag': 'aaa'} trace= cdbacae165c14051b89b7a530f071717 tx= GET /iso/:tag
  event iso-bbb tags= {'req-tag': 'bbb'} trace= c9faf9ee7239431bbfa129486b3f8d0b tx= GET /iso/:tag
  event iso-ccc tags= {'req-tag': 'ccc'} trace= 00f3837f7fff4a63915d2d50a31fb4f1 tx= GET /iso/:tag
  transaction GET /iso/:tag tags= {'req-tag': 'aaa'} trace= cdbacae165c14051b89b7a530f071717
  event sentinel tags= None trace= 81704928649b436a887b26a91afa9198

INCOMING TRACE:
  {"type":"transaction","name":"GET /users/:id","source":"route","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","http_route":"/users/:id"}

OUTGOING FETCH + DB (mysql2) + LOG, all unbundled:
  {"type":"transaction","name":"GET /fetchout","spans":["http.client GET http://127.0.0.1:41802/rec"]}
  {"type":"transaction","name":"GET /db","spans":["db SELECT * FROM users"]}
  {"type":"log","items":["info: hono-bun-log-line"]}
  recorder: {"url":"/rec","sentry-trace":"dcee4e236c6f4b1aa07c9de904ca2e79-97855e7048bb619f-1","baggage":"…,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,…"}

LEGACY mysql@2 — unbundled vs bundled (same code, only the build differs):
  UNBUNDLED: transaction GET /dbold []
  BUNDLED  : transaction GET /dbold ['db SELECT * FROM users']

STREAM LIFECYCLE (default), bundled:
  {"type":"span","items":[{"n":"http.server GET /users/:id","trace_id":"f73db87f…","route":"/users/:id"}]}
  {"type":"span","items":[{"n":"db SELECT users","parent_span_id":"a6f56c5c61de8d7a"},{"n":"http.server GET /db","route":"/db"}]}
  {"type":"span","items":[{"n":"http.client GET 127.0.0.1","parent_span_id":"9ab242f1209f827d"},{"n":"http.server GET /fetchout","route":"/fetchout"}]}
  {"type":"span","items":[{"n":"http.server GET /users/:id","trace_id":"cccccccccccccccccccccccccccccccc","parent_span_id":"dddddddddddddddd","route":"/users/:id"}]}
```

## Observed on 2026-09-07

Matches the record. All seven server capabilities reproduce; `client errors` stays not-run for the
same reason (server-only app). Environment drift: Bun is **1.4.2** here, not the recorded 1.4.0 (no
1.4.0 binary on this machine), and `hono@4` resolves to **4.13.7**, not the recorded 4.10.x. Neither
changed any verdict. `mysql2` resolved to 3.24.3, the same version the record names.

Unbundled, `bash run-unbundled.sh`, full dumps in `items-static.json` / `hits-static.json`:

```
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"3523194440464089b628e8251d4a7f69","http_route":"/users/:id","sdk":"sentry.javascript.hono","spans":[]}
{"type":"event","exception":"Error: hono-bun-route-error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":"bun","hasContextLine":true,"transaction":"GET /boom","trace_id":"e3a353c1fd7748789f8bb193c6bc748b"}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"e3a353c1fd7748789f8bb193c6bc748b","http_route":"/boom","spans":[]}

transaction GET /iso/:tag tags= {'req-tag': 'bbb'} trace= d91f9e6cc18247069eea33f315962943
event iso-bbb tags= {'req-tag': 'bbb'} trace= d91f9e6cc18247069eea33f315962943 tx= GET /iso/:tag
event iso-aaa tags= {'req-tag': 'aaa'} trace= 442b28f94e04425bae64f45b8daee089 tx= GET /iso/:tag
event iso-ccc tags= {'req-tag': 'ccc'} trace= c37f8093b2104595abb11b6ae98600f7 tx= GET /iso/:tag
transaction GET /iso/:tag tags= {'req-tag': 'aaa'} trace= 442b28f94e04425bae64f45b8daee089
transaction GET /iso/:tag tags= {'req-tag': 'ccc'} trace= c37f8093b2104595abb11b6ae98600f7
event sentinel tags= None trace= af4826dbe9964a0c97a3e884986cfe5c tx= GET /sentinel

{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","http_route":"/users/:id","spans":[]}
{"type":"transaction","name":"GET /fetchout","http_route":"/fetchout","spans":["http.client GET http://127.0.0.1:52182/rec"]}
{"type":"transaction","name":"GET /db","http_route":"/db","spans":["db SELECT * FROM users"]}
{"type":"transaction","name":"GET /dbold","http_route":"/dbold","spans":[]}
{"type":"log","items":["info: hono-bun-log-line"]}
recorder: {"url":"/rec","sentry-trace":"c5be2fdb83a843aeacd98bcff4394ea8-a9af0f737e0766b1-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=c5be2fdb83a843aeacd98bcff4394ea8,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.8065934678987907,sentry-sample_rate=1"}
```

Bundled, `bun run build.ts && bash run-bundled.sh`, dump in `items-bundled-static.json` — legacy
`mysql@2` now produces its span, everything else unchanged:

```
transaction GET /users/:id []
event Error: hono-bun-route-error auto.http.hono.context_error
transaction GET /boom []
transaction GET /users/:id []
transaction GET /fetchout ['http.client GET http://127.0.0.1:52182/rec']
transaction GET /db ['db SELECT * FROM users']
transaction GET /dbold ['db SELECT * FROM users']
log ['info: hono-bun-log-line']
```

Bundled with `LIFECYCLE=stream`, dump in `items-bundled-stream.json`:

```
{"type":"span","items":[{"n":"http.server GET /users/:id","trace_id":"ab5b621086574ca4a48e12d16882d21d","route":"/users/:id"}]}
{"type":"span","items":[{"n":"http.server GET /boom","trace_id":"4948c9ca65b940ec8696bb2b963b91dd","route":"/boom"}]}
{"type":"span","items":[{"n":"http.server GET /users/:id","trace_id":"cccccccccccccccccccccccccccccccc","parent_span_id":"dddddddddddddddd","route":"/users/:id"}]}
{"type":"span","items":[{"n":"http.client GET 127.0.0.1","parent_span_id":"ae439b99214c6ec2"},{"n":"http.server GET /fetchout","route":"/fetchout"}]}
{"type":"span","items":[{"n":"db SELECT users","parent_span_id":"9fb49313307ab8d4"},{"n":"http.server GET /db","route":"/db"}]}
{"type":"span","items":[{"n":"db SELECT users","parent_span_id":"a98ebb0331b9e244"},{"n":"http.server GET /dbold","route":"/dbold"}]}
event Error: hono-bun-route-error auto.http.hono.context_error 4948c9ca65b940ec8696bb2b963b91dd
log ['info: hono-bun-log-line']
```
