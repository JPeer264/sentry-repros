# M-koa-bun — Koa 2.16.4 + @koa/router 12.0.2 on Bun

## What it reproduces

Koa on Bun with the `develop` Bun SDK (10.67.0) is fully instrumented, but only when the app is
built through `Bun.build` with `sentryBunPlugin()`. In that bundled setup all seven audited
capabilities work: handler errors arrive with mechanism `auto.middleware.koa` (no
`Sentry.setupKoaErrorHandler(app)` call anywhere), the segment is named `GET /users/:id` from the
router with source `route`, concurrent requests keep their own tags and trace ids, an incoming
`sentry-trace`/`baggage` pair is continued, outgoing `fetch` gets an `http.client` span plus both
propagation headers, a module-scope `mysql@2` connection produces a `db` span, and
`Sentry.logger.info` arrives as a `log` envelope carrying the request trace id. The same app run
unbundled (`bun app.ts`) is the control: transaction names degrade to source `url`, there is no
router span and no db span, and the thrown handler error is never captured at all — only Koa's own
stderr trace and an HTTP 500.

## Install

```sh
cd $REPRO/cells/M-koa-bun
npm install
```

(`package.json` points `@sentry/*` at the 10.67.0 tarballs in `../../_toolbox/pack/`.)

## Run

```sh
D=$REPRO/cells/M-koa-bun
cd $D

# sink (41822) and downstream header recorder (41823)
PORT=41822 node sink.mjs > sink.log 2>&1 &   sinkpid=$!
PORT=41823 node recorder.mjs > recorder.log 2>&1 & recpid=$!

# the plugin build is what makes any of this work
bun run build.ts

# A) bundled, traceLifecycle 'static'
SINK_PORT=41822 REC_PORT=41823 APP_PORT=41821 LIFECYCLE=static bun dist/app.js > app-static.log 2>&1 & apppid=$!

curl -s -X DELETE http://127.0.0.1:41822/__items
curl -s http://127.0.0.1:41821/users/42
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
     -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sampled=true,sentry-sample_rate=1' \
     http://127.0.0.1:41821/users/99
for t in alpha bravo charlie; do curl -s "http://127.0.0.1:41821/iso?tag=$t" & done; wait
curl -s http://127.0.0.1:41821/boom; curl -s http://127.0.0.1:41821/fetch
curl -s http://127.0.0.1:41821/db;   curl -s http://127.0.0.1:41821/log
curl -s http://127.0.0.1:41821/sentinel        # wait until 'sentinel' shows up in __items, then +7s for logs
curl -s http://127.0.0.1:41822/__items
curl -s http://127.0.0.1:41823/__seen

kill $apppid; wait $apppid

# B) bundled, default traceLifecycle 'stream' (span envelopes, low-cardinality names)
SINK_PORT=41822 REC_PORT=41823 APP_PORT=41821 bun dist/app.js > app-stream.log 2>&1 & apppid=$!
# ...same curls...
kill $apppid; wait $apppid

# C) unbundled control — no plugin build
SINK_PORT=41822 REC_PORT=41823 APP_PORT=41821 LIFECYCLE=static bun app.ts > app-unbundled.log 2>&1 & apppid=$!
# ...same curls...
kill $apppid; wait $apppid

kill $sinkpid; kill $recpid
```

## Expected

Recorded verdict: all seven capabilities **work** (errors, route names, isolation, incoming trace,
outgoing fetch, db spans, logs), and all of them require the `sentryBunPlugin()` build except logs.

Recorded evidence (bundled, `traceLifecycle: 'static'`, `/__items`):

```
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"93a7bcc7f7ca4965bf34b317b2f927a9","spans":["router /users/:id"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["router /users/:id"]}
{"type":"event","exception":"iso alpha","mechanism":"generic","handled":true,"tags":{"probe":"alpha"},"trace_id":"39b45fc88dca461b8d5fb0bfb39870f6","txn":"GET /iso"}
{"type":"transaction","name":"GET /iso","source":"route","trace_id":"39b45fc88dca461b8d5fb0bfb39870f6","tags":{"probe":"alpha"},"spans":["router /iso"]}
{"type":"event","exception":"koa boom","mechanism":"auto.middleware.koa","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","trace_id":"52b6e588b5124ab18e10b2eac8265e92","txn":"GET /boom","hasContextLine":true}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","spans":["router /boom"]}
{"type":"transaction","name":"GET /fetch","source":"route","spans":["router /fetch","http.client GET http://127.0.0.1:52740/downstream"]}
{"type":"transaction","name":"GET /db","source":"route","spans":["router /db","db SELECT id, name FROM users"]}
{"type":"log","items":["info: hello from koa on bun trace=321d2a58604442149b4edd9e7c479f85"]}
```

Recorded recorder `/__seen`:

```
[{"url":"/downstream","sentryTrace":"48e8be913928467785c0d6c7ee4805fa-b6d7c7ef9ce7fec1-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=48e8be913928467785c0d6c7ee4805fa,sentry-org_id=1,sentry-transaction=GET%20%2Ffetch,sentry-sampled=true,sentry-sample_rate=1"}]
```

Recorded evidence (bundled, default `'stream'`): `router | /users/:id`, `http.server | GET /users/:id`,
`http.client | GET 127.0.0.1`, `db | SELECT users`, `sentry.segment.name.source=route`,
`http.route=/users/:id`, origin `auto.http.koa`.

## Observed on 2026-09-07

Matches. Bundled, `LIFECYCLE=static`, `/__items` (trimmed):

```
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"e4d8410666fd4e908bfdf46def5245b7","spans":["router /users/:id"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["router /users/:id"]}
{"type":"event","exception":"Error: iso alpha","mechanism":"generic","handled":true,"tags":{"probe":"alpha"},"trace_id":"8fa4b9ce47b849258eda116dceaea2ca","transaction":"GET /iso","hasContextLine":true}
{"type":"transaction","name":"GET /iso","op":"http.server","source":"route","status":"ok","trace_id":"8fa4b9ce47b849258eda116dceaea2ca","spans":["router /iso"]}
{"type":"event","exception":"Error: iso bravo","mechanism":"generic","handled":true,"tags":{"probe":"bravo"},"trace_id":"5012c685ea0246d2aa562f2f958d95a0","transaction":"GET /iso"}
{"type":"event","exception":"Error: iso charlie","mechanism":"generic","handled":true,"tags":{"probe":"charlie"},"trace_id":"27e95c9d7ed947b6ab3823dfbcfc6084","transaction":"GET /iso"}
{"type":"event","exception":"Error: koa boom","mechanism":"auto.middleware.koa","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"transaction":"GET /boom","trace_id":"ae239e8d2fe74921b51537aef154858f"}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"ae239e8d2fe74921b51537aef154858f","spans":["router /boom"]}
{"type":"transaction","name":"GET /fetch","op":"http.server","source":"route","status":"ok","spans":["router /fetch","http.client GET http://127.0.0.1:41823/downstream"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["router /db","db SELECT id, name FROM users"]}
{"type":"log","items":["info: hello from koa on bun"]}   # raw: trace_id d19bf01abd0f40119f51d39b756da57a == the GET /log transaction
```

Recorder `/__seen`:

```
[{"url":"/downstream","sentryTrace":"16bd742f628f44f6b062fb6c3da62873-afd3c252c2fe4984-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=16bd742f628f44f6b062fb6c3da62873,sentry-transaction=GET%20%2Ffetch,sentry-sampled=true,sentry-sample_rand=0.6351205576554678,sentry-sample_rate=1"}]
```

Bundled, default `'stream'`:

```
{"type":"span","items":["router /users/:id","http.server GET /users/:id"]}   origin auto.http.koa / auto.http.server, sentry.segment.name.source=route, http.route=/users/:id
{"type":"span","items":["http.client GET 127.0.0.1","router /fetch","http.server GET /fetch"]}
{"type":"span","items":["db SELECT users","router /db","http.server GET /db"]}   origin auto.db.mysql
{"type":"event","exception":"Error: koa boom","mechanism":"auto.middleware.koa","handled":false,"transaction":"GET /boom"}
```

Unbundled control (`bun app.ts`), confirming the recorded note:

```
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"log","items":["info: hello from koa on bun"]}
# no "koa boom" event at all; Koa printed its own stderr trace and answered HTTP 500
```

Differences from the record, none of them changing a verdict:

- Bun on this machine is now **1.4.2**, the record was taken on 1.4.0.
- The `baggage` header carries `sentry-sample_rand` and no `sentry-org_id` (the recorded run had
  `sentry-org_id=1` and no `sample_rand`). Both `sentry-trace` and `baggage` are present either way.
- The `log` line shows no trace id because this cell uses the plain `$REPRO/_toolbox/sink.mjs`; the record used
  an extended `sink2.mjs`. The trace id is in the raw envelope and matches the request.
- Ports are 41821/41822/41823 here instead of the recorded 52742/52734/52740.

## Files

- `instrument.ts` — `Sentry.init`, `LIFECYCLE` env var picks `stream` (default) or `static`
- `app.ts` — Koa + `@koa/router`, module-scope `mysql` connection, routes
  `/users/:id`, `/iso`, `/boom`, `/fetch`, `/db`, `/log`, `/sentinel`
- `build.ts` — `Bun.build` with `sentryBunPlugin()`, `external: ['@sentry/*']`
- `sink.mjs`, `recorder.mjs` — envelope sink and downstream header recorder
- `dist/` — output of `bun run build.ts`, regenerated by the Run step
- `items-static.json`, `items-stream.json`, `items-unbundled.json`, `app-*.log` — the observed run

MariaDB must be reachable at `127.0.0.1:3307` (root, no password, db `app`, table `users`).
