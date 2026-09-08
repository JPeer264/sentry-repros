# M-fastify-bun — Fastify 5.7.1 on Bun with @sentry/bun 10.67.0

## What it reproduces

Fastify on Bun needs **no** Bun plugin build for six of the seven audited capabilities: a plain
`bun app.mjs` with `import "./instrument.mjs"` as the first line already yields route-named server
spans/transactions with `source: route`, unhandled route-handler errors with mechanism
`auto.function.fastify`, per-request scope isolation under concurrency, incoming `sentry-trace`
continuation, `http.client` spans on outgoing `fetch` with `sentry-trace` + `baggage` propagated
downstream, and logs carrying the enclosing request's trace id. Fastify publishes its own diagnostics
channels and the develop SDK subscribes to them directly. The single exception is **database spans**:
a module-scope `mysql@2` connection produces no span at all on plain `bun run` (the query succeeds,
it is just uninstrumented, and the SDK stays silent without `debug: true`); only the
`sentryBunPlugin()` bundle (`bun build.mjs` → `bun dist/app.js`) adds `db SELECT id, name FROM users`.

## Install

```
cd $REPRO/cells/M-fastify-bun
P=$REPRO/_toolbox/pack
npm install --no-audit --no-fund \
  $P/sentry-bun-10.67.0.tgz $P/sentry-node-10.67.0.tgz $P/sentry-core-10.67.0.tgz \
  $P/sentry-server-utils-10.67.0.tgz $P/sentry-server-runtime-injection-10.67.0.tgz \
  $P/sentry-opentelemetry-10.67.0.tgz fastify@5.7.1 mysql@2
```

`npm`, not `bun add`: bun cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps.
MariaDB must be reachable on `127.0.0.1:3307` (user `root`, no password, db `app`, table `users`).

## Run

```
D=$REPRO/cells/M-fastify-bun
cd $D

# sink + downstream recorder (leave both running for all three runs)
PORT=48311 node sink.mjs > sink.log 2>&1 &      sinkpid=$!
PORT=48312 node recorder.mjs > rec.log 2>&1 &   recpid=$!

# viability baseline, no Sentry
PORT=48316 bun app-plain.mjs > plain.log 2>&1 & plainpid=$!
curl -s http://127.0.0.1:48316/users/42
kill $plainpid; wait $plainpid

# RUN A — plain `bun run`, traceLifecycle stream (default)
SINK_PORT=48311 PORT=48313 REC_PORT=48312 bun app.mjs > runA.log 2>&1 & apid=$!
node drive.mjs 48313 48312 48311 > runA-drive.log 2>&1
kill $apid; wait $apid

# RUN B — plain `bun run`, traceLifecycle static
LIFECYCLE=static SINK_PORT=48311 PORT=48314 REC_PORT=48312 bun app.mjs > runB.log 2>&1 & bpid=$!
node drive.mjs 48314 48312 48311 > runB-drive.log 2>&1
kill $bpid; wait $bpid

# RUN C — sentryBunPlugin bundle, traceLifecycle static
bun build.mjs
LIFECYCLE=static SINK_PORT=48311 PORT=48315 REC_PORT=48312 bun dist/app.js > runC.log 2>&1 & cpid=$!
node drive.mjs 48315 48312 48311 > runC-drive.log 2>&1
kill $cpid; wait $cpid

kill $sinkpid; wait $sinkpid; kill $recpid; wait $recpid
```

`drive.mjs` runs from plain `node`, not from the instrumented process, so its outgoing requests do not
carry an unsampled `sentry-trace`. It clears the sink, hits every route, sends a `sentinel` event and
polls for it, then waits 7s for the log flush before printing. `dist/` is checked in only to skip
`bun build.mjs`; the bundle keeps `@sentry/*` external, so it needs `node_modules` either way.

## Expected (recorded verdict)

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | **partial** — plain `bun run` emits no db span; only the `sentryBunPlugin()` bundle does |
| logs | works |

Recorded evidence lines:

```
RUN A — plain `bun app.mjs`, traceLifecycle stream (default). runA-drive.log:

 { "type": "event", "exception": "fastify boom", "mechanism": "auto.function.fastify", "handled": false,
   "trace": "53811ad6d4ed472bb9b27ffaad8dfc94", "parent": "b0821bad2a97ace7", "tx": "GET /error", "sdk": "sentry.javascript.bun" }
 { "type": "event", "exception": "iso 1", "mechanism": "generic", "handled": true, "tags": { "reqtag": "1" }, "trace": "1dbd9698de0040db9fda159e9ee7a5ae" }
 { "type": "event", "exception": "iso 2", "mechanism": "generic", "handled": true, "tags": { "reqtag": "2" }, "trace": "9cb161c7015a43978b54030a46590372" }
 { "type": "event", "exception": "iso 3", "mechanism": "generic", "handled": true, "tags": { "reqtag": "3" }, "trace": "8cec86149ad14033945ca2549dce2b72" }
 { "type": "span", "items": [ "[7cf9221b/p:ae5aa997] handler /users/:id", "[7cf9221b/p:b470c77e] handler /users/:id", "[7cf9221b/p:-] http.server GET /users/:id" ] }
 { "type": "span", "items": [ "[14613c6f/p:bb6ec950] http.client GET 127.0.0.1", "[14613c6f/p:81f90502] handler /downstream", "[14613c6f/p:-] http.server GET /downstream" ] }
 { "type": "span", "items": [ "[fb92d5a8/p:8cdeb815] handler /db", "[fb92d5a8/p:a27d199a] handler /db", "[fb92d5a8/p:-] http.server GET /db" ] }        <-- no db span
 { "type": "span", "items": [ "[aabbccdd/p:9bed7e4d] handler /users/:id", "[aabbccdd/p:b51fa0aa] handler /users/:id", "[aabbccdd/p:11223344] http.server GET /users/:id" ] }
 { "type": "log", "items": [ "info: hello from fastify on bun trace=b9433ec3" ] }
RECORDER: [{"url":"/hit","sentryTrace":"14613c6fe0854c608df99f505060204f-9a7650a1dbf2116f-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=14613c6fe0854c608df99f505060204f,sentry-org_id=1,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rate=1"}]

RUN B — plain `bun app.mjs`, LIFECYCLE=static. runB-drive.log:

 { "type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok",
   "spans": [ "handler GET /users/:id", "handler fastify - route-handler" ] }
 { "type": "transaction", "name": "GET /error", "op": "http.server", "source": "route", "status": "internal_error", ... }
 { "type": "transaction", "name": "GET /iso", "source": "route", "trace": "4003a5b7e7c743f49cb554fdc425f81f", "tags": { "reqtag": "1" }, ... }
 { "type": "transaction", "name": "GET /iso", "source": "route", "trace": "f72646db33704edfb6dbd4b02d14f8b2", "tags": { "reqtag": "2" }, ... }
 { "type": "transaction", "name": "GET /iso", "source": "route", "trace": "5b768d452d724ff1bf44484d2291ac48", "tags": { "reqtag": "3" }, ... }
 { "type": "transaction", "name": "GET /downstream", "spans": [ "handler GET /downstream", "handler fastify - route-handler", "http.client GET http://127.0.0.1:41338/hit" ] }
 { "type": "transaction", "name": "GET /db", "spans": [ "handler GET /db", "handler fastify - route-handler" ] }        <-- no db span
```

RUN C (recorded): the same `GET /db` handler under the `sentryBunPlugin()` bundle emits
`db SELECT id, name FROM users`.

## Observed on 2026-09-07

Matches the record on all seven capabilities. Ports differ (48311-48316 instead of 41337-41341) and
the local Bun is **1.4.2**, not the recorded 1.4.0; no 1.4.0 binary is on this machine. Nothing else
differs.

```
RUN A — plain `bun app.mjs`, traceLifecycle stream (default). runA-drive.log:

{"type":"event","exception":"fastify boom","mechanism":"auto.function.fastify","handled":false,"trace":"a1c6f595392d40a7b333ebb543835d8b","parent":"aa1cea4259726962","tx":"GET /error","sdk":"sentry.javascript.bun"}
{"type":"event","exception":"iso 1","mechanism":"generic","handled":true,"tags":{"reqtag":"1"},"trace":"208bb096083443c6a6dddad6fd4744f2","parent":"a263b3ff27c4019c","tx":"GET /iso","sdk":"sentry.javascript.bun"}
{"type":"event","exception":"iso 2","mechanism":"generic","handled":true,"tags":{"reqtag":"2"},"trace":"80714f70bc5b434b9ae2880d23f22283","parent":"81e45e25ee082ab6","tx":"GET /iso","sdk":"sentry.javascript.bun"}
{"type":"event","exception":"iso 3","mechanism":"generic","handled":true,"tags":{"reqtag":"3"},"trace":"8eda5ae18012409991f1644ebb2c976b","parent":"9936163dd8546833","tx":"GET /iso","sdk":"sentry.javascript.bun"}
{"type":"span","items":["[7ce0cb0a/p:b7f5a14e] handler /users/:id","[7ce0cb0a/p:9eab28d9] handler /users/:id","[7ce0cb0a/p:-] http.server GET /users/:id"]}
{"type":"span","items":["[81e1a7d4/p:b5cb166a] http.client GET 127.0.0.1","[81e1a7d4/p:97440efd] handler /downstream","[81e1a7d4/p:af1e83b8] handler /downstream","[81e1a7d4/p:-] http.server GET /downstream"]}
{"type":"span","items":["[7bfb655e/p:82887163] handler /db","[7bfb655e/p:b2fff384] handler /db","[7bfb655e/p:-] http.server GET /db"]}        <-- no db span
{"type":"span","items":["[aabbccdd/p:a799363f] handler /users/:id","[aabbccdd/p:bfef50b8] handler /users/:id","[aabbccdd/p:11223344] http.server GET /users/:id"]}
{"type":"log","items":["info: hello from fastify on bun trace=f7c1f45f"]}
RECORDER: [{"url":"/hit","sentryTrace":"81e1a7d4c5314153884a65dca35a52e9-bdea3e9bb43a6a81-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=81e1a7d4c5314153884a65dca35a52e9,sentry-org_id=1,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rand=0.876985061268519,sentry-sample_rate=1"}]

RUN B — plain `bun app.mjs`, LIFECYCLE=static. runB-drive.log:

{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace":"7cf653bd52b5436f9d73ead1cfa5ea44","spans":["handler GET /users/:id","handler fastify - route-handler"]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace":"a18e324909824760b24f58aad127b7e6","spans":["handler GET /error","handler fastify - route-handler"]}
{"type":"transaction","name":"GET /iso","op":"http.server","source":"route","status":"ok","trace":"d5f020ac9fb6446e958e0d7021408c28","tags":{"reqtag":"1"},"spans":["handler GET /iso","handler fastify - route-handler"]}
{"type":"transaction","name":"GET /iso","op":"http.server","source":"route","status":"ok","trace":"eba57c64d0664225b0b91082fd39875c","tags":{"reqtag":"2"},"spans":["handler GET /iso","handler fastify - route-handler"]}
{"type":"transaction","name":"GET /iso","op":"http.server","source":"route","status":"ok","trace":"f46768f0026647eeb2fa1daec4862dcf","tags":{"reqtag":"3"},"spans":["handler GET /iso","handler fastify - route-handler"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","trace":"6b6e3f22a14641bfa1107779a9f2c104","spans":["handler GET /downstream","handler fastify - route-handler","http.client GET http://127.0.0.1:48312/hit"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace":"20e2c96d6a8e48e0abe60921a10b826b","spans":["handler GET /db","handler fastify - route-handler"]}        <-- no db span
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace":"aabbccddeeff00112233445566778899","parent":"1122334455667788","spans":["handler GET /users/:id","handler fastify - route-handler"]}
{"type":"log","items":["info: hello from fastify on bun trace=f67d1d38"]}

RUN C — sentryBunPlugin bundle, LIFECYCLE=static. runC-drive.log:

{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace":"756732e8a35842828cb3bdb974d198f6","spans":["handler GET /db","handler fastify - route-handler","db SELECT id, name FROM users"]}
```

Viability baseline (no Sentry, `bun app-plain.mjs`): `{"id":"42","name":"ok"}`.
