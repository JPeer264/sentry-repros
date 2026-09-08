# B09 - Request body capture on Bun.serve

Runtime: bun 1.4.0 | SDK: `@sentry/bun` 10.67.0 (develop tarballs from `_toolbox/pack`)

## What it reproduces

`Bun.serve` never captures the incoming request body. With `dataCollection: {}` the error event
and the transaction carry `request.headers` / `method` / `url` / `cookies` / `query_string` but no
`request.data`, no matter whether the handler read the body (`req.text()`) or not, and for both
`routes: {}` handlers and the `fetch` fallback. `dataCollection: { httpBodies: [] }` therefore
changes nothing, because the bodies were absent either way. `bunServerIntegration` takes no options;
`maxRequestBodySize` and `ignoreRequestBody` exist only on `bunHttpServerIntegration` (`node:http`),
and the `node:http` server that this app starts in the same process does get `request.data` and does
drop it under `httpBodies: []`.

## Install

```
npm install
```

(`package.json` pins the develop tarballs at `../../_toolbox/pack/sentry-*-10.67.0.tgz`.)

## Run

`run.sh <mode> <app port> <sink port>` starts the envelope sink, starts the app, drives it from a
plain `node` process, waits for a `sentinel` event, and writes `items-<mode>.json`.

```
cd $REPRO/probes/B09
./run.sh permissive 41294 41293   # dataCollection: {}
./run.sh nobodies   41296 41293   # dataCollection: { httpBodies: [] }
```

The sink is `sink.mjs` (a copy of `$S/qs/sink.mjs` extended to keep the whole `request` object and
the body-related `contexts.trace.data` attributes). `run.sh` starts and kills it itself; to run it by
hand: `PORT=41293 node sink.mjs > sink.log 2>&1 &`.

The app binds `Bun.serve` on `<app port>` and a comparison `node:http` server on `<app port> + 1`.

Type-level checks:

```
grep -n bunServerIntegration node_modules/@sentry/bun/build/types/integrations/bunserver.d.ts
grep -n 'RequestBody\|ignoreRequestBody' node_modules/@sentry/bun/build/types/integrations/bunHttpServer.d.ts
```

## Expected

Recorded verdict: **broken**.

Recorded evidence:

```
dataCollection: {} (MODE permissive, app log line 1: MODE permissive {}):
{"type":"event","exception":"route boom (read body) {\"hello\":\"world\"}","mechanism":"auto.http.bun.serve","handled":false,"sdk":"sentry.javascript.bun","request":{"headers":{"host":"127.0.0.1:41294","content-type":"application/json",...,"content-length":"17"},"method":"POST","url":"http://127.0.0.1:41294/throw-read","cookies":{},"query_string":""}}
{"type":"transaction","name":"POST /throw-read","op":"http.server","source":"route","status":"internal_error","request":{...,"content-length":"17"},"method":"POST","url":"http://127.0.0.1:41294/throw-read","cookies":{},"query_string":""},"traceBodyAttrs":{},"spans":[]}
(same shape, no `data` key, for POST /throw [unread body] and POST /fetch-throw [fetch fallback])
Comparison, node:http server in the same process, same run:
{"type":"transaction","name":"POST /node-throw","op":"http.server","source":"url","status":"ok","request":{...,"method":"POST","url":"http://127.0.0.1:41295/node-throw","cookies":{},"data":"{\"hello\":\"world\"}"},"traceBodyAttrs":{"http.request.body.size":17},"spans":[]}

dataCollection: { httpBodies: [] } (MODE nobodies, app log line 1: MODE nobodies {"httpBodies":[]}):
{"type":"event","exception":"route boom (read body) {\"hello\":\"world\"}","mechanism":"auto.http.bun.serve",..."request":{"headers":{...},"method":"POST","url":"http://127.0.0.1:41296/throw-read","cookies":{},"query_string":""}}
{"type":"transaction","name":"POST /throw-read",..."request":{...,"url":"http://127.0.0.1:41296/throw-read","cookies":{},"query_string":""},"traceBodyAttrs":{},"spans":[]}
node:http in nobodies mode: {"type":"transaction","name":"POST /node-throw",..."request":{...,"url":"http://127.0.0.1:41303/node-throw","cookies":{}},"traceBodyAttrs":{"http.request.body.size":17},"spans":[]}  (no `data` key)

Built types, packages/bun/build/types/integrations/bunserver.d.ts:16:
export declare const bunServerIntegration: () => import("@sentry/core").Integration & { name: "BunServer" };
(no options parameter; the source never touches request.body)
bunHttpServer.d.ts:31 ignoreRequestBody?: (url: string, request: http.RequestOptions) => boolean;
bunHttpServer.d.ts:37 maxRequestBodySize?: 'none' | 'small' | 'medium' | 'always';  (bunHttpServerIntegration, node:http only)
```

## Observed on 2026-09-07

Matches the recorded verdict. `bun 1.4.0`, `node v26.5.0`, `@sentry/bun@10.67.0`.

`app-permissive.log` line 1: `MODE permissive {}` — `items-permissive.json`:

```
{"type":"event","exception":"route boom (read body) {\"hello\":\"world\"}","mechanism":"auto.http.bun.serve","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","request":{"headers":{"host":"127.0.0.1:41294","connection":"keep-alive","content-type":"application/json","accept":"*/*","accept-language":"*","sec-fetch-mode":"cors","user-agent":"node","accept-encoding":"gzip, deflate","content-length":"17"},"method":"POST","url":"http://127.0.0.1:41294/throw-read","cookies":{},"query_string":""}}
{"type":"transaction","name":"POST /throw-read","op":"http.server","source":"route","status":"internal_error","spans":[],"request":{"headers":{...,"content-length":"17"},"method":"POST","url":"http://127.0.0.1:41294/throw-read","cookies":{},"query_string":""},"traceBodyAttrs":{}}
{"type":"transaction","name":"POST /throw","op":"http.server","source":"route","status":"internal_error","spans":[],"request":{...,"method":"POST","url":"http://127.0.0.1:41294/throw","cookies":{},"query_string":""},"traceBodyAttrs":{}}
{"type":"transaction","name":"POST /fetch-throw","op":"http.server","source":"url","status":"internal_error","spans":[],"request":{...,"method":"POST","url":"http://127.0.0.1:41294/fetch-throw","cookies":{},"query_string":""},"traceBodyAttrs":{}}
{"type":"transaction","name":"POST /node-throw","op":"http.server","source":"url","status":"ok","spans":[],"request":{"headers":{...,"content-length":"17"},"method":"POST","url":"http://127.0.0.1:41295/node-throw","cookies":{},"data":"{\"hello\":\"world\"}"},"traceBodyAttrs":{"http.request.body.size":17}}
```

`app-nobodies.log` line 1: `MODE nobodies {"httpBodies":[]}` — `items-nobodies.json`:

```
{"type":"event","exception":"route boom (read body) {\"hello\":\"world\"}","mechanism":"auto.http.bun.serve","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","request":{"headers":{...,"content-length":"17"},"method":"POST","url":"http://127.0.0.1:41296/throw-read","cookies":{},"query_string":""}}
{"type":"transaction","name":"POST /throw-read","op":"http.server","source":"route","status":"internal_error","spans":[],"request":{...,"url":"http://127.0.0.1:41296/throw-read","cookies":{},"query_string":""},"traceBodyAttrs":{}}
{"type":"transaction","name":"POST /node-throw","op":"http.server","source":"url","status":"ok","spans":[],"request":{"headers":{...,"content-length":"17"},"method":"POST","url":"http://127.0.0.1:41297/node-throw","cookies":{}},"traceBodyAttrs":{"http.request.body.size":17}}
```

Type-level checks reproduce at the recorded line numbers:

```
node_modules/@sentry/bun/build/types/integrations/bunserver.d.ts
16:export declare const bunServerIntegration: () => import("@sentry/core").Integration & {
node_modules/@sentry/bun/build/types/integrations/bunHttpServer.d.ts
31:    ignoreRequestBody?: (url: string, request: http.RequestOptions) => boolean;
37:    maxRequestBodySize?: 'none' | 'small' | 'medium' | 'always';
```

### Differences from the record

None that change the verdict. Two rebuild details differ from the lost original:

- The record's `/node-throw` handler threw inside the `node:http` `'end'` listener. On this rebuild
  that kills the Bun process through `onUncaughtException` before the sentinel is sent, and no
  `node:http` transaction arrives, so the handler calls `Sentry.captureException` and ends the
  response instead. The recorded transaction is `"status":"ok"`, which is what this handler produces.
- The recorded nobodies node:http port was 41303 (a third run); here both bun and node:http ports
  come from one run, so the node:http URL is `41297`.
