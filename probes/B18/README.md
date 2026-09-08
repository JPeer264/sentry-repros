# B18 — `node:http` server on Bun (no framework)

Runtime: **bun 1.4.0** · SDK: `@sentry/bun@10.67.0` (develop / v11 line, tarballs from `_toolbox/pack`) · Node baseline on **node v26.5.0** with `@sentry/node@10.67.0`

## What it reproduces

A bare `http.createServer` app on Bun, no framework, with routes `/` (200), `/error` (synchronous
`throw` inside the handler), `/error-async` (the handler schedules an unhandled rejection and still
answers 200), `/slow?id=X&ms=N` (`Sentry.setTag('reqid', X)`, wait `N` ms, `captureMessage('iso-X')`)
and `/sentinel?n=N`. A plain `node` driver (`drive.mjs`, outside the instrumented process, so the
server transaction is not marked unsampled by an inherited `sentry-trace`) hits `/`, then three
concurrent `/slow` requests at 600/300/100 ms, then `/error-async`, then sentinel 1, waits for
sentinel 1 in the sink, then `/error`, then sentinel 2. The probe shows that every `node:http`
request gets an `http.server` segment span and that concurrent requests stay isolated, and it
contrasts two error paths: a synchronous throw (captured as `auto.node.onuncaughtexception` without
request context, process exits) and a handler-scheduled unhandled rejection (captured without
request context on Bun, but *with* `transaction` and `request.url` on Node). Four variants:
plain `bun run app.ts`, the `sentryBunPlugin` bundle (`bun run dist/app.js`),
`traceLifecycle: 'static'` (`app-static.ts`), and the Node baseline (`node-app.mjs`).

`sink.mjs` is `$S/qs/sink.mjs` with the compact mappings extended to keep trace ids, `request`,
`tags`, `origin` and the span-stream attributes (`sentry.segment.name.source`, `url.path`,
`http.request.method`, `http.response.status_code`, `is_segment`).

## Install

```
cd $REPRO/probes/B18
P=$REPRO/_toolbox/pack
npm install --no-audit --no-fund $P/sentry-bun-10.67.0.tgz $P/sentry-core-10.67.0.tgz \
  $P/sentry-node-10.67.0.tgz $P/sentry-opentelemetry-10.67.0.tgz \
  $P/sentry-server-utils-10.67.0.tgz $P/sentry-server-runtime-injection-10.67.0.tgz
```

## Run

```
cd $REPRO/probes/B18

# 1. plain bun run
PORT=41873 node sink.mjs > sink-plain.log 2>&1 & sp=$!
SINK_PORT=41873 PORT=41874 bun run app.ts > app-plain.log 2>&1 & ap=$!
sleep 2; node drive.mjs 41874 41873 > drive-plain.out 2>&1; sleep 2
curl -s http://127.0.0.1:41873/__items | python3 -c 'import json,sys;[print(json.dumps(x)) for x in json.load(sys.stdin)]'
kill $ap 2>/dev/null; kill $sp; wait $sp 2>/dev/null

# 2. sentryBunPlugin bundle (dist/ is committed; rebuild with `bun run build.ts`)
PORT=42311 node sink.mjs > sink-build.log 2>&1 & sp=$!
SINK_PORT=42311 PORT=42312 bun run dist/app.js > app-build.log 2>&1 & ap=$!
sleep 2; node drive.mjs 42312 42311 > drive-build.out 2>&1; sleep 2
curl -s http://127.0.0.1:42311/__items | python3 -m json.tool
kill $ap 2>/dev/null; kill $sp; wait $sp 2>/dev/null

# 3. traceLifecycle: 'static'
PORT=43611 node sink.mjs > sink-static.log 2>&1 & sp=$!
SINK_PORT=43611 PORT=43612 bun run app-static.ts > app-static.log 2>&1 & ap=$!
sleep 2; node drive.mjs 43612 43611 > drive-static.out 2>&1; sleep 2
curl -s http://127.0.0.1:43611/__items | python3 -m json.tool
kill $ap 2>/dev/null; kill $sp; wait $sp 2>/dev/null

# 4. Node 26 baseline, same app
PORT=43711 node sink.mjs > sink-node.log 2>&1 & sp=$!
SINK_PORT=43711 PORT=43712 node node-app.mjs > app-node.log 2>&1 & ap=$!
sleep 2; node drive.mjs 43712 43711 > drive-node.out 2>&1; sleep 2
curl -s http://127.0.0.1:43711/__items | python3 -m json.tool
kill $ap 2>/dev/null; kill $sp; wait $sp 2>/dev/null
```

Ports are arbitrary, pick free ones. The app process dies on `/error`, so `kill $ap` is expected to
find no process in every variant.

## Expected

Recorded verdict: **partial**.

With plain `bun run` and with the `sentryBunPlugin` build (identical results), every `node:http`
request gets an `http.server` segment span (stream lifecycle: name `GET`, source `url`, `url.path`
set; with `traceLifecycle: 'static'`: transaction `GET /slow`, source `url`, `request.url` filled)
and each of 3 concurrent requests is isolated (distinct trace ids, `reqid` tag and `request.url`
match the request that set them). A synchronous throw inside the request handler is captured via
`auto.node.onuncaughtexception` but WITHOUT request context (request null, trace id equals the
global scope's, no `http.server` span for `/error`) and Bun then exits the process (same as the Node
baseline for a sync throw). An unhandled rejection from the handler is also captured without request
context on Bun, whereas the same app under Node attaches `transaction: GET /error-async` and
`request.url` to it.

Recorded evidence lines:

```
plain bun run (develop, stream lifecycle):
{"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"5d15ae56e6384d5b9777e6a55ddbbbbe","segment":true,"status":"ok","method":"GET","path":"/","code":200,"origin":"auto.http.server"}]}
{"type":"event","message":"iso-C","transaction":"GET /slow","request":{"url":"http://127.0.0.1:41874/slow?id=C&ms=100","method":"GET"},"trace_id":"406de6ad278f475489aa2d58fc9bdefc","tags":{"reqid":"C"}}
{"type":"event","message":"iso-B","transaction":"GET /slow","request":{"url":"http://127.0.0.1:41874/slow?id=B&ms=300"},"trace_id":"86013c5bb5d14e509694a94ce7826f70","tags":{"reqid":"B"}}
{"type":"event","message":"iso-A","transaction":"GET /slow","request":{"url":"http://127.0.0.1:41874/slow?id=A&ms=600"},"trace_id":"c683716a56fa419ebf315ef70d75cff2","tags":{"reqid":"A"}}
{"type":"span","items":[{"name":"GET","op":"http.server","trace_id":"406de6ad278f475489aa2d58fc9bdefc","path":"/slow","code":200}]}  (one such span per /slow request, trace ids match the iso-* events)
{"type":"event","exception":"async handler boom","mechanism":"auto.node.onunhandledrejection","handled":false,"request":null,"trace_id":"350c4afe69e541bd8af7804afde44f55"}
{"type":"event","exception":"handler boom","mechanism":"auto.node.onuncaughtexception","handled":false,"request":null,"trace_id":"350c4afe69e541bd8af7804afde44f55"}
GET /error ->   (empty response) ; GET /sentinel?n=2 -> ERR ECONNREFUSED ; app alive after drive: no
app log: error: handler boom at app.ts:15:46 ... at wrapServerEmitRequest (packages/core/build/esm/integrations/http/server-subscription.js:121:9)

plugin build (bun run dist/app.js): same shape, e.g. {"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"1bd89ea00d284b009ac2f40b463194be","path":"/slow","code":200,"origin":"auto.http.server"}]} and {"exception":"handler boom","mechanism":"auto.node.onuncaughtexception","request":null}

traceLifecycle static: {"type":"transaction","name":"GET /slow","op":"http.server","source":"url","status":"ok","trace_id":"0fea2c8307274234a5f95183b22e9148","request":{"url":"http://127.0.0.1:43612/slow?id=C&ms=100","method":"GET"},"tags":{"reqid":"C"},"origin":"auto.http.server","spans":[]} ; no transaction for /error

Node 26 baseline (same app, @sentry/node develop): {"exception":"async handler boom","mechanism":"auto.node.onunhandledrejection","transaction":"GET /error-async","request":{"url":"http://127.0.0.1:43712/error-async"}} ; sync throw: {"exception":"handler boom","mechanism":"auto.node.onuncaughtexception","request":null} and process exits
```

## Observed on 2026-09-07

Matches the recorded verdict (**partial**). All four variants reproduce.

1. plain `bun run app.ts` (ports 41873/41874), sink, trimmed:

```json
{"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"acb7b541531d42c1906e9fc5ec2b01c9","segment":true,"status":"ok","method":"GET","path":"/","code":200,"origin":"auto.http.server"}]}
{"type":"event","message":"iso-C","transaction":"GET /slow","trace_id":"4b07f20bcd8341938fa02121fd603de4","tags":{"reqid":"C"},"request":{"url":"http://127.0.0.1:41874/slow?id=C&ms=100","method":"GET"}}
{"type":"event","message":"iso-B","transaction":"GET /slow","trace_id":"5a97d9bf5ae848b1b7b06a3da279c01d","tags":{"reqid":"B"},"request":{"url":"http://127.0.0.1:41874/slow?id=B&ms=300","method":"GET"}}
{"type":"event","message":"iso-A","transaction":"GET /slow","trace_id":"a29bcd47b7a44ec1b3d9ff4f3cbbf843","tags":{"reqid":"A"},"request":{"url":"http://127.0.0.1:41874/slow?id=A&ms=600","method":"GET"}}
{"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"4b07f20bcd8341938fa02121fd603de4","segment":true,"status":"ok","method":"GET","path":"/slow","code":200,"origin":"auto.http.server"}]}
{"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"5a97d9bf5ae848b1b7b06a3da279c01d","segment":true,"status":"ok","method":"GET","path":"/slow","code":200,"origin":"auto.http.server"}]}
{"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"a29bcd47b7a44ec1b3d9ff4f3cbbf843","segment":true,"status":"ok","method":"GET","path":"/slow","code":200,"origin":"auto.http.server"}]}
{"type":"event","exception":"Error: async handler boom","mechanism":"auto.node.onunhandledrejection","handled":false,"trace_id":"b08300cc230d40729d535502a96cd7ea","request":null}
{"type":"event","exception":"Error: handler boom","mechanism":"auto.node.onuncaughtexception","handled":false,"trace_id":"b08300cc230d40729d535502a96cd7ea","request":null}
```

No `http.server` span for `/error` (the last span in the sink is `/sentinel`). `drive-plain.out`:

```
GET /error -> 200 
GET /sentinel?n=2 -> ERR ECONNREFUSED
app alive after drive: no
```

`app-plain.log`:

```
error: handler boom
      at $REPRO/probes/B18/app.ts:9:15
      at emit (node:events:103:22)
      ...
      at wrapServerEmitRequest ($REPRO/probes/B18/node_modules/@sentry/core/build/esm/integrations/http/server-subscription.js:121:9)
```

2. `sentryBunPlugin` bundle, `bun run dist/app.js` (ports 42311/42312): identical shape.

```json
{"type":"span","items":[{"name":"GET","op":"http.server","source":"url","trace_id":"62c72d2f596b4eacb44b0094ea407e2e","segment":true,"status":"ok","method":"GET","path":"/slow","code":200,"origin":"auto.http.server"}]}
{"type":"event","exception":"Error: handler boom","mechanism":"auto.node.onuncaughtexception","handled":false,"trace_id":"1b8725c8c4214d13a5eab473e34e2770","request":null}
```

3. `traceLifecycle: 'static'` (ports 43611/43612):

```json
{"type":"transaction","name":"GET /slow","op":"http.server","source":"url","status":"ok","trace_id":"71c60c9a61944e67929fbb6baa2d2a89","sdk":"sentry.javascript.bun","request":{"url":"http://127.0.0.1:43612/slow?id=C&ms=100","method":"GET"},"tags":{"reqid":"C"},"origin":"auto.http.server","spans":[]}
```

No transaction for `/error`; the transactions present are `GET /`, three `GET /slow`,
`GET /error-async` and `GET /sentinel`.

4. Node 26 baseline, `node node-app.mjs` (ports 43711/43712):

```json
{"type":"event","exception":"Error: async handler boom","mechanism":"auto.node.onunhandledrejection","handled":false,"transaction":"GET /error-async","trace_id":"bd5c2e947c3b4e8e9de7a52ffb44e7de","request":{"url":"http://127.0.0.1:43712/error-async","method":"GET"}}
{"type":"event","exception":"Error: handler boom","mechanism":"auto.node.onuncaughtexception","handled":false,"trace_id":"2a87b11590144c3eb27c8166aa42b590","request":null}
```

Differences from the record, both cosmetic and coming from this rebuild's own files rather than from
the SDK:

- The driver prints `GET /error -> 200 ` (status plus an empty body) where the record wrote
  `GET /error ->   (empty response)`; on Bun the response headers are already flushed when the
  process dies, so `fetch` resolves with 200 and an empty body. On Node the same request fails with
  `ERR UND_ERR_SOCKET`, which the record did not quote but which is the same "connection dies mid
  response" observation.
- The rebuilt sink also keeps `exception` for `captureMessage` events (`"undefined: iso-C"`, from the
  synthetic stack trace that `attachStacktrace` attaches), `user.ip_address` and `environment`; the
  record's sink trimmed those away. The lines above are trimmed to the recorded fields.
- Line numbers in the app stack trace differ (`app.ts:9:15` here versus `app.ts:15:46` in the record)
  because the rebuilt `app.ts` is not byte-identical to the lost one; the frame that matters,
  `wrapServerEmitRequest` in `@sentry/core`'s `server-subscription.js`, is the same.
