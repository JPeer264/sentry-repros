# M-koa-deno — Koa 3.2.1 + @koa/router 15.7.0 on Deno 2.9.0

## What it reproduces

Koa runs fine on Deno and the base `@sentry/deno` SDK (10.67.0, from `develop`) gives useful
telemetry alongside it, but the Deno import hook and Koa are mutually exclusive: adding the
documented `import "@sentry/deno/import";` kills the process at import time inside
`statuses/index.js` -> `require('./codes.json')` (denoland/deno#36240), before the server ever
listens. Without the hook there is no Koa instrumentation at all, so server spans come only from
`denoHttpIntegration`: the segment is named from the raw URL (`GET /users/42`, source `url`) under
`traceLifecycle: 'static'` and is just `GET` under the default `'stream'` lifecycle, with no
`http.route`. Koa swallows handler errors into `app.onerror`, and the SDK's auto-attach runs off the
`orchestrion:koa:callback` channel that only the (crashing) hook injects, so nothing reaches Sentry
for `/boom` unless the app registers `app.on('error', ...)` by hand — `@sentry/deno` exports no
`setupKoaErrorHandler`. Outgoing `fetch` gets neither span nor propagation headers (Deno finding
K2), while a `node:http` client request from the same handler does get both. Module-scope `mysql@2`
produces no db span. Isolation, incoming-trace continuation and logs work, all of them from the
Deno HTTP integration rather than from Koa.

## Install

```sh
cd $REPRO/cells/M-koa-deno
npm install
```

(`package.json` points `@sentry/*` at the 10.67.0 `develop` tarballs in `../../_toolbox/pack/`.)

## Run

```sh
D=$REPRO/cells/M-koa-deno
cd $D

# sink (41931) and downstream header recorder (41933); app on 41935, hook-only app on 41937
PORT=41931 node sink.mjs > sink.log 2>&1 &      sinkpid=$!
PORT=41933 node recorder.mjs > recorder.log 2>&1 & recpid=$!

# A) Koa on Deno without Sentry, control that Koa itself works
APP_PORT=41935 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys plain.ts &
curl -s http://127.0.0.1:41935/users/42

# B) WITH the import hook -> dies at import, never listens
SINK_PORT=41931 RECORDER_PORT=41933 APP_PORT=41935 LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-hook.ts

# C) WITHOUT the hook, static lifecycle, hand-registered app.on('error')
curl -s -X DELETE http://127.0.0.1:41931/__items
SINK_PORT=41931 RECORDER_PORT=41933 APP_PORT=41935 LIFECYCLE=static ERR_HANDLER=1 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-nohook.ts > app-static.log 2>&1 & apppid=$!

curl -s http://127.0.0.1:41935/users/42
curl -s http://127.0.0.1:41935/boom
curl -s http://127.0.0.1:41935/db
curl -s http://127.0.0.1:41935/downstream
curl -s http://127.0.0.1:41935/downstream-http
curl -s http://127.0.0.1:41935/log
curl -s -o /dev/null http://127.0.0.1:41935/iso/alpha & \
  curl -s -o /dev/null http://127.0.0.1:41935/iso/beta & \
  curl -s -o /dev/null http://127.0.0.1:41935/iso/gamma & wait
curl -s -o /dev/null -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
  -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public' \
  http://127.0.0.1:41935/users/99
curl -s -o /dev/null http://127.0.0.1:41935/sentinel   # wait for 'sentinel' in __items, then +7s for logs
curl -s http://127.0.0.1:41931/__items
curl -s http://127.0.0.1:41933/__seen
kill $apppid; wait $apppid

# D) same app, default 'stream' lifecycle (drop LIFECYCLE)
SINK_PORT=41931 RECORDER_PORT=41933 APP_PORT=41935 ERR_HANDLER=1 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-nohook.ts > app-stream.log 2>&1 & apppid=$!
# ...same curls..., then: curl -s 'http://127.0.0.1:41931/__items?raw=1'
kill $apppid; wait $apppid

# E) control for the `errors` verdict: same app WITHOUT ERR_HANDLER
SINK_PORT=41931 RECORDER_PORT=41933 APP_PORT=41935 LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-nohook.ts > app-noerrhandler.log 2>&1 & apppid=$!
curl -s http://127.0.0.1:41935/boom; curl -s http://127.0.0.1:41935/sentinel
kill $apppid; wait $apppid

# F) the hook itself is fine without Koa in the graph (db span sanity check)
SINK_PORT=41931 APP_PORT=41937 LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-hook-nokoa.ts > app-hook-nokoa.log 2>&1 & apppid=$!
curl -s http://127.0.0.1:41937/db; curl -s http://127.0.0.1:41937/sentinel
kill $apppid; wait $apppid

kill $sinkpid; kill $recpid
```

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | partial — nothing reaches Sentry for `/boom` unless `app.on('error', ...)` is registered by hand |
| route names | broken — `GET /users/42` source `url` (static), bare `GET` with no `http.route` (stream) |
| isolation | works |
| incoming trace | works |
| outgoing fetch | broken — no `http.client` span and no headers for `fetch`; `node:http` does work |
| db spans | broken — module-scope `mysql@2` produces no span without the hook, and the hook crashes with Koa |
| logs | works |

Recorded evidence:

```
### 1. Koa on Deno WITHOUT Sentry: boots and serves
$ curl -s http://127.0.0.1:52318/users/42
{"id":"42"}

### 2. WITH the import hook: process dies before listen
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
var codes = require('./codes.json')
            ^
    at Object.<anonymous> (.../M-koa-deno/node_modules/statuses/index.js:15:13)

### 3. WITHOUT the hook, traceLifecycle 'static'
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"8ff778c997504321b33881b727a1f685","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"bc78d9df10e5406caab10db54e7b0cc0","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"ac0ba22463e947e6bda393b1bea04a8d","spans":[]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","trace_id":"4ffcb9c646e34c7aa4fc70c6d0cf0121","spans":[]}
{"type":"log","items":["info: koa deno log trace=9eec5d41"]}
-> no `event` item for /boom at all; koa's own default handler prints to stderr:
  Error: koa boom
      at Application.handleRequest (.../node_modules/koa/lib/application.js:204:12)

### 4. With a hand-registered app.on('error')
{"type":"event","exception":"koa boom","mechanism":"manual.koa.onerror","handled":false,"sdk":"sentry.javascript.deno","transaction":"GET /boom","trace_id":"d80a6454eab543fbbe2dcb026bb7108e","hasContextLine":true}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"d80a6454eab543fbbe2dcb026bb7108e","spans":[]}

### 5. Isolation, 3 concurrent requests
{"type":"event","exception":"iso alpha","tags":{"req_tag":"alpha"},"transaction":"GET /iso/alpha","trace_id":"5b2464859b5a44348c790e915152c15b"}
```

Recorded incoming trace: `GET /users/99` yields trace_id `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
parent_span_id `bbbbbbbbbbbbbbbb`. Recorded outgoing fetch: recorder saw
`sentry-trace: null, baggage: null`, while `node:http` produced
`http.client GET http://127.0.0.1:38219/api/node-http` nested in the request transaction.

## Observed on 2026-09-07

Matches, all seven verdicts identical.

B) with the import hook, `deno run main-hook.ts` exits 1 and never listens:

```
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
var codes = require('./codes.json')
            ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Module._compile (node:module:1691:23)
    at require (node:module:1815:16)
    at Object.<anonymous> (file:///.../cells/M-koa-deno/node_modules/statuses/index.js:15:13)
```

C) without the hook, `LIFECYCLE=static ERR_HANDLER=1`, `/__items` (trimmed, `items-static.json`):

```
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"b60afb9431734489b9c83eb0fecd3ae0","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"35bd9dd9643249389acc0d1e7ba5dc58","spans":[]}
{"type":"event","exception":"Error: koa boom","mechanism":"manual.koa.onerror","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"transaction":"GET /boom","trace_id":"35bd9dd9643249389acc0d1e7ba5dc58"}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"7cbb6308630e4938b27d42811776aa83","spans":[]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","trace_id":"c757a290ec5f4a4dbfd81818f5333d1d","spans":[]}
{"type":"transaction","name":"GET /downstream-http","op":"http.server","source":"url","status":"ok","trace_id":"fb89b05d4666469cb799e2db73cec110","spans":["http.client GET http://127.0.0.1:41933/api/node-http"]}
{"type":"event","exception":"Error: iso alpha","mechanism":"generic","handled":true,"tags":{"req_tag":"alpha"},"transaction":"GET /iso/alpha","trace_id":"ac0fe51282ea427b99a271dfecfe4217"}
{"type":"transaction","name":"GET /iso/alpha","op":"http.server","source":"url","status":"ok","trace_id":"ac0fe51282ea427b99a271dfecfe4217","spans":[]}
{"type":"event","exception":"Error: iso gamma","mechanism":"generic","handled":true,"tags":{"req_tag":"gamma"},"transaction":"GET /iso/gamma","trace_id":"8540149373b84612b331272765b753b9"}
{"type":"event","exception":"Error: iso beta","mechanism":"generic","handled":true,"tags":{"req_tag":"beta"},"transaction":"GET /iso/beta","trace_id":"c03f1ad2a1e6479a8057db12b47e7963"}
{"type":"transaction","name":"GET /users/99","op":"http.server","source":"url","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}
{"type":"log","items":["info: koa deno log trace=9d55f515"]}   # GET /log transaction trace_id 9d55f51595b34b70a6ececc82adbb470
```

Recorder `/__seen` for that run:

```
[{"url":"/api/fetch","sentryTrace":null,"baggage":null},
 {"url":"/api/node-http","sentryTrace":"fb89b05d4666469cb799e2db73cec110-a0b1098c31806d2f-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=fb89b05d4666469cb799e2db73cec110,sentry-sampled=true,sentry-sample_rand=0.4820314513257914,sentry-sample_rate=1"}]
```

D) default `'stream'` lifecycle (`items-stream.json`, `items-stream-raw.json`): every server segment
is the bare method, no `http.route`, and the only child span in the whole run is the `node:http`
client one.

```
{"type":"span","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.server"}]}
{"type":"span","items":["http.client GET 127.0.0.1","http.server GET"]}
{"type":"event","exception":"Error: koa boom","mechanism":"manual.koa.onerror","handled":false,"transaction":"GET /boom"}
{"type":"log","items":["info: koa deno log trace=d931d7f8"]}
# attributes on the /users/42 segment:
GET {"sentry.origin":"auto.http.server","sentry.op":"http.server","sentry.segment.name.source":"url","url.path":"/users/42","http.request.method":"GET"}
```

E) control without `ERR_HANDLER` (`items-noerrhandler.json`): no `koa boom` event at all, only the
transaction, and Koa's own handler on stderr.

```
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"319d2ba35d1d44c89b7f2c302387d31a","spans":[]}
# app-noerrhandler.log:
  Error: koa boom
      at file:///.../cells/M-koa-deno/app.ts:20:9
      at Application.handleRequest (file:///.../cells/M-koa-deno/node_modules/koa/lib/application.js:204:12)
```

F) the hook itself is fine when Koa is not in the graph (`items-hook-nokoa.json`):

```
{"type":"transaction","name":"SELECT id, name FROM users","op":"db","source":"custom","status":"ok","trace_id":"4aa007f485844f8aa185ffe1d707745b","spans":[]}
```

`setupKoaErrorHandler` does not appear anywhere in `node_modules/@sentry/deno/build/`, confirming
the record; `attachKoaErrorHandler` is exported from `@sentry/server-utils`.

Differences from the record, none of which change a verdict:

- Ports are 41931/41933/41935/41937 here instead of the recorded 38217/38219/38221.
- Under `'stream'` the server segment does carry `sentry.segment.name.source: "url"`; the record
  said there is no source attribute. The substance is unchanged: the value is `url`, never `route`.
- The sink prints `exception` as `"<type>: <value>"` (`"Error: koa boom"`), the record's `sink2.mjs`
  printed the value alone (`"koa boom"`).
- The `db` span under the hook (F) arrives as its own `db` segment rather than nested under the
  request; the record's detail line was truncated at that point, so this may or may not be a
  difference.
- `baggage` on the `node:http` request carries `sentry-sample_rand` (not present in the record's
  reference baggage lines) — both propagation headers are there either way.

## Files

- `instrument.ts` — `Sentry.init`; `LIFECYCLE` picks `stream` (default) or `static`, `SENTRY_DEBUG=1` turns on `debug`
- `app.ts` — Koa + `@koa/router`, module-scope `mysql` pool, routes `/users/:id`, `/boom`, `/db`,
  `/downstream` (fetch), `/downstream-http` (`node:http`), `/log`, `/iso/:tag`, `/sentinel`;
  `ERR_HANDLER=1` registers the hand-written `app.on('error', ...)`
- `main-nohook.ts` — `import './instrument.ts'; import './app.ts';` (the only working wiring)
- `main-hook.ts` — the same plus `import '@sentry/deno/import';` as line 1 (crashes)
- `main-hook-nokoa.ts` — hook + `node:http` + `mysql`, no Koa, to show the hook works on its own
- `plain.ts` — Koa with no Sentry at all
- `sink.mjs` — `_toolbox/qs/sink.mjs` plus an 8-char trace id on every log line
- `recorder.mjs` — downstream server that records `sentry-trace` / `baggage`
- `items-*.json`, `recorder-seen.json`, `app-*.log`, `plain.log` — the observed run

MariaDB must be reachable at `127.0.0.1:3307` (root, no password, db `app`, table `users`).
