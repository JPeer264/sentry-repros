# D14 - node:http server on Deno (no framework)

Runtime: Deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)
| no import hook: `main-http.ts` imports `@sentry/deno` directly

## What it reproduces

A plain `node:http` `createServer` app on Deno, initialised with `@sentry/deno` and no framework and
no import hook, is driven over the routes that expose every part of the server story at once:
`/hello/world` (plain 200), `/captured` (`Sentry.captureException` inside the handler), `/downstream`
(an outgoing `node:http` client request to this same server's `/echo/users/7`, which echoes the
headers it received and its own trace/span ids), `/downstream-fetch` (the same hop over global
`fetch`), `/status-500`, `/nope` (404), three concurrent `/slow?id=A|B|C&ms=300` requests that each
write `Sentry.setTag("reqId", id)` and `Sentry.setUser({id})`, read the isolation scope back after the
sleep and capture `slow-<id>`, `/error-sync` (a throw taken synchronously in the request listener,
before any `await`) and `/error` (a throw after an `await` inside the not-awaited handler promise).
Each run is done twice, under the default `traceLifecycle: "stream"` and under
`traceLifecycle: "static"`. `main-serve.ts` serves the identical routes from `Deno.serve` as the
comparison, and `bare-sync-throw.ts` is the same sync throw with no Sentry in the process at all, to
show whether the gap is the SDK's or Deno's.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-deno-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
```

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses exactly this `node_modules`.

## Run

From this directory. `run.sh <label> <main file> <static|stream> <sink port> <app port> [paths]`
starts `sink.mjs` on the sink port (writing every envelope to `raw-<label>.ndjson`), starts

```
PORT=<app port> SINK=<sink port> TRACE_LIFECYCLE=<static|stream> \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys <main file>
```

waits for it to answer, runs `node drive.mjs <app port> <sink port> <paths>` from a plain node
process (so no `sentry-trace` header from the driver marks the server span unsampled), waits for the
`sentinel` event to reach the sink and then 7 s, and kills both. Ports are free choice; check they
are unused first.

```
./run.sh http-stream       main-http.ts  stream 41417 41427
./run.sh http-static       main-http.ts  static 41418 41428
./run.sh http-error-sync   main-http.ts  static 41419 41429 "/error-sync,/hello/world"
./run.sh http-error-async  main-http.ts  static 41420 41430 "/error,/hello/world"
./run.sh serve-stream      main-serve.ts stream 41421 41431 "/hello/world,/error,/error-sync,/captured,/downstream,/downstream-fetch,/status-500,/nope,CONC"
./run.sh serve-static      main-serve.ts static 41422 41432 "/hello/world,/error,/error-async,/captured,/downstream,CONC"

# no-Sentry control for the sync throw:
PORT=41401 deno run --no-prompt --allow-net --allow-env bare-sync-throw.ts > app-bare.log 2>&1 & bp=$!
sleep 3; node bare-drive.mjs 41401 > bare-drive.out 2>&1; kill $bp; wait $bp
```

Outputs land in `drive-<label>.out` (RESPONSES, LINES, SINK), `app-<label>.log`,
`raw-<label>.ndjson` and `sink-<label>.log` (which must say `sink on <port>`).

## Expected

Recorded verdict: **partial**.

`http.createServer` on Deno 2.9.0 with `@sentry/deno` 10.67.0 (no import hook needed) produces
`http.server` spans/transactions with full request attributes, correct per-request isolation under
concurrency, and outgoing `node:http` client spans with `sentry-trace`/`baggage` propagation into a
child `http.server` span (same trace). What does not work: a synchronous throw inside the request
listener is swallowed by Deno itself (client gets an empty 400, no error event, and the SDK records
the transaction as status ok / `http.response.status_code` 200), and an async throw is captured only
via the global `unhandledrejection` handler, after which the SDK rethrows and the whole server
process exits (response never sent, later requests ECONNREFUSED). `Deno.serve` captures both cases
with mechanism `auto.http.deno`, answers 500 and keeps running. Naming: stream lifecycle (default)
names the segment span just `GET` (`sentry.segment.name.source: url`, `url.path` attribute carries
the path); `traceLifecycle: "static"` yields transactions `GET /hello/world`, source `url`. Outgoing
`fetch` gets no span and no headers (known K2), same as `Deno.serve`.

Recorded evidence lines:

```
[stream, default] span: http.server "GET" seg=true /hello/world code=200 status=ok trace=5b1f1323696c4005a27cd84a8ef7bcf4 origin=auto.http.server
[stream] event: captured in handler | mech generic handled true | txn GET /captured | trace 463c819c8b6348c39d2a9b75960b83ce span 9c38a5906dd47e35 | req http://127.0.0.1:53827/captured
[stream, propagation] span: [http.server "GET" /echo/users/7 trace=fe6512eece3a46f6b9437fa44f4bbb93 id=85ea01293e635b06 parent=b4bb797e9f196cb3 origin=auto.http.server, http.client "GET 127.0.0.1" /echo/users/7 code=200 trace=fe6512eece3a46f6b9437fa44f4bbb93 id=b4bb797e9f196cb3 parent=8472d74b97ef167d origin=auto.http.client, http.server "GET" /downstream trace=fe6512eece3a46f6b9437fa44f4bbb93 id=8472d74b97ef167d]
[stream, echo response] "/downstream": "200 {\"traceId\":\"fe6512eece3a46f6b9437fa44f4bbb93\",\"spanId\":\"8472d74b97ef167d\",\"echo\":{\"path\":\"/echo/users/7\",\"headers\":{\"host\":\"127.0.0.1:58976\",\"sentry-trace\":\"fe6512eece3a46f6b9437fa44f4bbb93-b4bb797e9f196cb3-1\",\"baggage\":\"sentry-environment=production,sentry-public_key=public,sentry-trace_id=fe6512eece3a46f6b9437fa44f4bbb93,...
[stream, fetch] "/downstream-fetch": "200 {... \"headers\":{\"accept\":\"*/*\",\"accept-language\":\"*\",\"user-agent\":\"Deno/2.9.0\",\"accept-encoding\":\"gzip,br\",\"host\":\"127.0.0.1:58976\"}}" (no sentry-trace; no http.client span)
[stream, isolation] concurrent: 200 {"id":"A","tagNow":"A","userNow":"A","activeSpan":"90baf0872a4edd53"} / {"id":"B","tagNow":"B","userNow":"B","activeSpan":"a53afc31f1a49ca5"} / {"id":"C","tagNow":"C","userNow":"C","activeSpan":"b1e532f572bf9301"}
event: slow-A | txn GET /slow | trace 85dc2e0dcad042898b11bca33c221b1c span 90baf0872a4edd53 | tags {"reqId":"A"} user A | req http://127.0.0.1:53827/slow?id=A&ms=300
event: slow-B | trace cc7857f819124b9fbda33a6f021f2988 span a53afc31f1a49ca5 | tags {"reqId":"B"} user B
event: slow-C | trace 990cb92c146a480b9119697c75bc6b56 span b1e532f572bf9301 | tags {"reqId":"C"} user C
[static] transaction: GET /hello/world | source url status ok code 200 | trace fe779aa44c104048bc207d5dfd642ac4
[static] transaction: GET /downstream | source url status ok code 200 | trace d974655ba7144f3c9d2077fd31d3ffd3 id 98994b67aecbe514 | spans ["http.client GET http://127.0.0.1:58977/echo/users/7 [a3cee059c1a78fb7<-98994b67aecbe514] ok"]
[static] transaction: GET /echo/users/7 | source url status ok code 200 | trace d974655ba7144f3c9d2077fd31d3ffd3 id a3a20f92fec35bb2 parent a3cee059c1a78fb7
[static] transaction: GET /status-500 | source url status internal_error code 500
[error, sync throw in listener] RESPONSES "/error-sync": "400 " ; SINK: transaction: GET /error-sync | source url status ok code 200 | trace eaa3f89f9fb74233aff1ee1fb8dd3ba5 ; no event for it (only the sentinel event arrived)
[error, sync throw, no Sentry at all] /error-sync 400 "" conn: close ; app log: request /error-sync (process keeps running, nothing printed)
```

Recorded notes:

1. Root cause of the sync-throw gap is Deno, not the SDK: without Sentry, a throw inside the
   `node:http` request listener is swallowed by Deno's `node:http` shim, the client receives an empty
   HTTP 400 with `Connection: close`, and nothing reaches `globalThis` `error` or the server `error`
   event. Because the response object is never written, `response.statusCode` stays 200 and the SDK
   ends the span with status ok / `http.response.status_code` 200 while the client actually got 400.
2. The async-throw process exit is SDK-intended behaviour:
   `packages/deno/src/integrations/globalhandlers.ts:86-125` captures the rejection, calls
   `e.preventDefault()`, flushes, then rethrows "to replicate Deno default behavior".
3. Differences `node:http` vs `Deno.serve` in the same SDK: `node:http` events carry
   `transaction: "GET /path"` while `Deno.serve` events have no `transaction` field; `node:http`
   spans have origin `auto.http.server`, `Deno.serve` spans `auto.http.deno`; when a `Deno.serve`
   handler throws, its segment span has no `http.response.status_code` and status ok even though Deno
   answers 500.

## Observed on 2026-09-07

Matches the recorded verdict (**partial**), on the first run, in every part. Verbatim trimmed output
of the run above:

```
[stream, default] (drive-http-stream.out)
span: http.server "GET" seg=true /hello/world code=200 status=ok trace=d1f91ce01f434e09828f69aa50b0ecb1 id=90eeeaba267f15b4 parent=undefined origin=auto.http.server nameSource=url
event: Error: captured in handler | mech generic handled true | txn GET /captured | trace a75cf3730be6448cabeab1832ac1c9a5 span ac4fd134aba36129 | tags undefined user undefined | req http://127.0.0.1:41427/captured

[stream, propagation] (drive-http-stream.out)
span: http.server "GET" seg=true /echo/users/7 code=200 status=ok trace=5b3bf6f6189d472e94b6b79dd0119f38 id=9c7c4475b0074980 parent=ae6045734e4eb1c1 origin=auto.http.server nameSource=url
span: http.client "GET 127.0.0.1" seg=false /echo/users/7 code=200 status=ok trace=5b3bf6f6189d472e94b6b79dd0119f38 id=ae6045734e4eb1c1 parent=bd4010a6e6d9581e origin=auto.http.client nameSource=undefined
span: http.server "GET" seg=true /downstream code=200 status=ok trace=5b3bf6f6189d472e94b6b79dd0119f38 id=bd4010a6e6d9581e parent=undefined origin=auto.http.server nameSource=url

[stream, echo response] (drive-http-stream.out)
"/downstream": "200 {\"traceId\":\"5b3bf6f6189d472e94b6b79dd0119f38\",\"spanId\":\"bd4010a6e6d9581e\",\"echo\":{\"path\":\"/echo/users/7\",\"headers\":{\"host\":\"127.0.0.1:41427\",\"sentry-trace\":\"5b3bf6f6189d472e94b6b79dd0119f38-ae6045734e4eb1c1-1\",\"baggage\":\"sentry-environment=production,sentry-public_key=public,sentry-trace_id=5b3bf6f6189d472e94b6b79dd0119f38,sentry-sampled=true,sentry-sample_rand=0.9779180044333833,sentry-sample_rate=1\",\"connection\":\"keep-alive\"}}}"

[stream, fetch] (drive-http-stream.out)
"/downstream-fetch": "200 {\"traceId\":\"bc491b651f8d4dc98eb95826af27a3b9\",\"spanId\":\"8cf6a7a78b221130\",\"echo\":{\"path\":\"/echo/users/7\",\"headers\":{\"accept\":\"*/*\",\"accept-language\":\"*\",\"user-agent\":\"Deno/2.9.0\",\"accept-encoding\":\"gzip,br\",\"host\":\"127.0.0.1:41427\"}}}"
span: http.server "GET" seg=true /echo/users/7 code=200 status=ok trace=b7b95e2ec5224cfba6ae15afc2beae9a id=aa78520d7cd0c616 parent=undefined origin=auto.http.server nameSource=url
span: http.server "GET" seg=true /downstream-fetch code=200 status=ok trace=bc491b651f8d4dc98eb95826af27a3b9 id=8cf6a7a78b221130 parent=undefined origin=auto.http.server nameSource=url

[stream, isolation] (drive-http-stream.out)
"CONC": [
  "200 {\"id\":\"A\",\"tagNow\":\"A\",\"userNow\":\"A\",\"activeSpan\":\"875c1514c5e27de8\"}",
  "200 {\"id\":\"B\",\"tagNow\":\"B\",\"userNow\":\"B\",\"activeSpan\":\"b56f193fccc3866e\"}",
  "200 {\"id\":\"C\",\"tagNow\":\"C\",\"userNow\":\"C\",\"activeSpan\":\"9113993a310c4986\"}"
 ]
event: slow-A | mech generic handled true | txn GET /slow | trace ce2d77621b2b45d6b960148a2133f9e7 span 875c1514c5e27de8 | tags {"reqId":"A"} user A | req http://127.0.0.1:41427/slow?id=A&ms=300
event: slow-B | mech generic handled true | txn GET /slow | trace 4ba77ffd5c6b45dead962665e84689e3 span b56f193fccc3866e | tags {"reqId":"B"} user B | req http://127.0.0.1:41427/slow?id=B&ms=300
event: slow-C | mech generic handled true | txn GET /slow | trace 1e448cf3037c4f27a9aeafbe42af85ef span 9113993a310c4986 | tags {"reqId":"C"} user C | req http://127.0.0.1:41427/slow?id=C&ms=300
span: http.server "GET" seg=true /status-500 code=500 status=error trace=608aab43f2bb42869207a99198c0083b id=9161df2739f7d0eb parent=undefined origin=auto.http.server nameSource=url
span: http.server "GET" seg=true /nope code=404 status=error trace=c4f0acc8b2554934855e9aa707e7d5c2 id=ad30581e09d999a1 parent=undefined origin=auto.http.server nameSource=url

[static] (drive-http-static.out)
transaction: GET /hello/world | source url status ok code 200 | trace 270565dbb9e8483c9a06c963453ea388 id a59e08a9d9b7a881 parent undefined | spans []
transaction: GET /echo/users/7 | source url status ok code 200 | trace 61e68921b9b54de982b15349b3abeb23 id ab16c8bcb60027ef parent a67243b4468bbdbe | spans []
transaction: GET /downstream | source url status ok code 200 | trace 61e68921b9b54de982b15349b3abeb23 id bb87dbb8f075b2a9 parent undefined | spans ["http.client GET http://127.0.0.1:41428/echo/users/7 [a67243b4468bbdbe<-bb87dbb8f075b2a9] ok"]
transaction: GET /status-500 | source url status internal_error code 500 | trace 3b66b35c42244b718c0cc92e66b89689 id bef55e0ab1f5f817 parent undefined | spans []

[error, sync throw in listener] (drive-http-error-sync.out)
 "/error-sync": "400 ",
 "/hello/world": "200 hello world",
transaction: GET /error-sync | source url status ok code 200 | trace 21902fb8760f427bbfdf095aa60ab9e8 id 8d07c901ec0a3e86 parent undefined | spans []
event: sentinel | mech generic handled true | txn GET /sentinel | ...        <- the only event in the run

[error, sync throw, no Sentry at all] (bare-drive.out, app-bare.log)
/error-sync 400 "" conn: close
/hello/world 200 "hello world\n" conn: keep-alive
bare app on 41401
request /error-sync
request /hello/world

[error, async throw in handler] (drive-http-error-async.out, app-http-error-async.log)
 "/error": "FETCH FAILED UND_ERR_SOCKET",
 "/hello/world": "FETCH FAILED ECONNREFUSED",
 "/sentinel": "FETCH FAILED ECONNREFUSED"
sentinelEventArrived=false
event: Error: async throw in handler | mech auto.deno.global_handlers.unhandledrejection handled false | txn GET /error | trace 1f796dac87dd47c0a693587819b70170 span 864db440fd17b28e | tags undefined user undefined | req http://127.0.0.1:41430/error
error: Uncaught (in promise) Error: async throw in handler

[Deno.serve comparison, stream] (drive-serve-stream.out)
 "/error": "500 Internal Server Error",
 "/error-sync": "500 Internal Server Error",
event: Error: async throw in handler | mech auto.http.deno handled false | txn undefined | trace 193455a3695843bda462dc5c99076319 span bbe746e6e1e3d564 | ... | req http://127.0.0.1:41431/error
event: Error: sync throw in listener | mech auto.http.deno handled false | txn undefined | trace 6bbb6128b8434c25886693e7d3223f05 span 9e27ce0de01b96d5 | ... | req http://127.0.0.1:41431/error-sync
span: http.server "GET" seg=true /error code=undefined status=ok trace=193455a3695843bda462dc5c99076319 id=bbe746e6e1e3d564 parent=undefined origin=auto.http.deno nameSource=url
"/downstream-fetch": "200 {... \"headers\":{\"accept\":\"*/*\",\"accept-encoding\":\"gzip,br\",\"accept-language\":\"*\",\"host\":\"127.0.0.1:41431\",\"user-agent\":\"Deno/2.9.0\"}}}"   (no sentry-trace)

[Deno.serve comparison, static] (drive-serve-static.out)
transaction: GET /error | source url status ok code undefined | trace 64d127b83b7646078787434062fe6bc6 id 9c5d955c74f3e260 parent undefined | spans []
transaction: GET /downstream | source url status ok code 200 | trace f82a17f1e7fa482d8a7af2ac41c6af47 id 99b99b28dc1ebba1 parent undefined | spans ["http.client GET http://127.0.0.1:41432/echo/users/7 [b3700d9fc9f4ecb8<-99b99b28dc1ebba1] ok"]
```

Every recorded claim holds. The working half: `http.server` segment spans named `GET` with
`sentry.segment.name.source: url` and the path in `url.path`, origin `auto.http.server`, correct
status codes including 500 and 404 (`status=error`); three concurrent `/slow` requests each read back
only their own tag and user and produce three distinct trace ids matching their own server span; the
`node:http` client hop carries `sentry-trace`/`baggage` and the downstream `http.server` span is a
child of the `http.client` span in the same trace; `static` yields `GET /hello/world` transactions
with source `url` and the client hop as a nested span. The broken half: `/error-sync` answers an
empty `400`, the transaction is recorded as status ok / code 200, and no event is produced (the run's
only event is the sentinel), while the no-Sentry control answers the same empty `400` with
`Connection: close` and logs nothing, so the swallow is Deno's; `/error` is captured only as
`auto.deno.global_handlers.unhandledrejection` `handled false` and the process then exits, so the
response never arrives (`UND_ERR_SOCKET`) and every later request is `ECONNREFUSED`. `Deno.serve`
answers 500 to both throws, captures both with `auto.http.deno`, keeps running, and its events carry
no `transaction` field while its `/error` span keeps status ok with no status code. `fetch` gets no
`http.client` span and no propagation headers on either server (K2).

Differences from the record are cosmetic: ports (41417-41432 and 41401 instead of 53817-53828,
47313-47326 and 47301), the run's own trace and span ids, and run labels without the `-b`/`-c`
suffixes. This rebuild also prints `nameSource` and `parent` on every span line, which the recorded
run reported in prose, and it uses one shared `routes.ts` for both servers instead of duplicating the
route table in `main-http.ts` and `main-serve.ts`.

## Files

- `routes.ts` - the route table and `Sentry.init`, shared by both servers
- `main-http.ts` - the `node:http` `createServer` app (`/error-sync` throws in the listener itself)
- `main-http-hook.ts` - the same app behind `import "@sentry/deno/import"`, for the hook variant
- `main-serve.ts` - the `Deno.serve` comparison app
- `bare-sync-throw.ts`, `bare-drive.mjs` - the sync throw with no Sentry in the process
- `deno.json` - `nodeModulesDir: "manual"`
- `sink.mjs` - `_toolbox/sink.mjs` with span and transaction mappings extended for span ids, parents,
  `url.path`, status code and `sentry.segment.name.source`
- `drive.mjs` - drives the listed paths, runs the concurrency triple on `CONC`, sends the sentinel,
  waits for it, dumps RESPONSES / LINES / SINK
- `run.sh` - starts sink and app, drives, kills both
- `drive-*.out`, `app-*.log`, `raw-*.ndjson`, `sink-*.log`, `bare-drive.out`, `app-bare.log` - the run above
