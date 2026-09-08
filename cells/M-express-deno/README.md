# M-express-deno — Express 5.2.1 on Deno 2.9.0

## What it reproduces

Express 5.2.1 running on Deno 2.9.0 with the develop (v11 line, 10.67.0) `@sentry/deno` SDK. It shows
that Express is fully instrumentable on Deno — route names, handler spans, unhandled route errors,
request isolation, incoming trace continuation, `mysql@2` db spans and logs all work — but only when
the `@sentry/deno/import` hook is active AND a one-line user-land workaround for denoland/deno#36240
is registered right after it. Without that workaround `import "@sentry/deno/import"` makes
`require('./codes.json')` inside `statuses` throw `SyntaxError: Unexpected token ':'` and Express
cannot even be imported; without the hook at all the SDK silently degrades to url-named transactions
with no child spans and captures nothing for a thrown route error. The one capability that stays
broken with the workaround is the outgoing `fetch`: no `http.client` span and no propagation headers
(the known Deno K2 gap).

## Install

```
npm install --no-audit --no-fund
```

(The `@sentry/*` deps resolve from `../../_toolbox/pack/*.tgz`, all built from `develop` at 10.67.0.)

## Run

```
cd $REPRO/cells/M-express-deno

# sink (envelopes) + recorder (downstream fetch headers)
PORT=41734 node sink.mjs > sink.log 2>&1 &
PORT=41735 node recorder.mjs > recorder.log 2>&1 &

# 0) Express 5 on Deno without Sentry
APP_PORT=41733 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys bare.ts
curl http://127.0.0.1:41733/users/42

# 1) import hook only, no jsonfix -> SyntaxError on codes.json
APP_PORT=41733 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys app-hook-only.ts

# 2) import hook + jsonfix load hook, stream lifecycle (default)
APP_PORT=41733 SINK_PORT=41734 REC_PORT=41735 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys app.ts

# 3) same, static lifecycle (transaction envelopes with nested spans[])
APP_PORT=41736 SINK_PORT=41734 REC_PORT=41735 LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys app.ts

# 4) no hook at all
APP_PORT=41737 SINK_PORT=41734 REC_PORT=41735 LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys app-nohook.ts

# drive + read (adjust the app port per variant)
curl -s -X DELETE http://127.0.0.1:41734/__items
for p in /users/42 /error /downstream /db /log; do curl -s -o /dev/null http://127.0.0.1:41733$p; done
curl -s http://127.0.0.1:41733/sentinel
for t in alpha beta gamma; do curl -s -o /dev/null http://127.0.0.1:41733/iso/$t & done; wait
TID=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
curl -s -H "sentry-trace: $TID-bbbbbbbbbbbbbbbb-1" \
     -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" \
     http://127.0.0.1:41733/users/9
curl -s http://127.0.0.1:41733/sentinel
sleep 9; curl -s http://127.0.0.1:41734/__items; curl -s http://127.0.0.1:41735/__seen
```

MariaDB must be reachable at `127.0.0.1:3307` (root, no password, db `app`, table `users`).

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works — unhandled route throw arrives with mechanism `auto.http.express`, `handled:false`, `transaction: "GET /error"`, request url and context lines. Without the hook nothing is captured. |
| route names | works — static: `GET /users/:id`, op `http.server`, source `route`, child `handler /users/:id`. Stream: `http.server GET /users/:id` with `http.route: /users/:id`. Without the hook: `GET /users/42`, source `url`, zero child spans. |
| isolation | works — three concurrent `/iso/{alpha,beta,gamma}` produce three events, each with only its own tag, its own trace_id and its own request url. |
| incoming trace | works — `sentry-trace: aaaa…aaaa-bbbbbbbbbbbbbbbb-1` yields `http.server GET /users/:id` with that trace_id and `parent_span_id: bbbbbbbbbbbbbbbb`. |
| outgoing fetch | broken — no `http.client` span anywhere and the recorder sees `sentry-trace: null, baggage: null` (Deno K2). |
| db spans | works — module-scope `mysql@2` query gives `db SELECT id, name FROM users` under `handler /db` (static) / `db SELECT users` on the request trace (stream). Requires the hook. |
| logs | works — `Sentry.logger.info('hello from express on deno')` arrives as `info: hello from express on deno` after the ~7s flush. |

Recorded evidence lines:

```
### 1. Express 5 on Deno 2.9.0 WITHOUT Sentry — boots and serves
$ curl http://127.0.0.1:51437/users/42
{"id":"42"}

### 2. Sentry import hook alone (no jsonfix) — Express cannot be imported
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
var codes = require('./codes.json')
            ^
    at Object.<anonymous> (.../node_modules/statuses/index.js:15:13)

### 4. Stream lifecycle (default), hook + jsonfix
{ "type": "event", "exception": "express boom", "mechanism": "auto.http.express", "handled": false,
  "sdk": "sentry.javascript.deno", "runtime": {"name":"deno","version":"2.9.0"},
  "hasContextLine": true, "transaction": "GET /error", "request": "http://127.0.0.1:41733/error" }

{ "type": "span", "items": [
    { "n": "handler /users/:id", "parent": "8d15d49840b64e0d", "http_route": "/users/:id" },
    { "n": "http.server GET /users/:id", "http_route": "/users/:id" } ] }

{ "type": "span", "items": [
    { "n": "db SELECT users", "parent": "810935d7484ced6b" },
    { "n": "handler /db", "http_route": "/db" },
    { "n": "http.server GET /db", "http_route": "/db" } ] }

# /downstream — no http.client child anywhere
$ curl http://127.0.0.1:41735/__seen
[{"url":"/rec","sentry-trace":null,"baggage":null}]

{ "type": "log", "items": ["info: hello from express on deno"] }

### 5. Isolation — 3 concurrent /iso/:tag
{ "exception": "iso-beta",  "tags": {"who":"beta"},  "trace_id": "56f7…", "transaction": "GET /iso/:tag" }
{ "exception": "iso-alpha", "tags": {"who":"alpha"}, "trace_id": "a240…", "transaction": "GET /iso/:tag" }
{ "exception": "iso-gamma", "tags": {"who":"gamma"}, "trace_id": "7fdc…", "transaction": "GET /iso/:tag" }

### 6. Incoming trace continuation
{ "n": "http.server GET /users/:id", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent": "bbbbbbbbbbbbbbbb" }
```

## Observed on 2026-09-07

Rebuilt with the develop tarballs (`file:../../_toolbox/pack/sentry-{core,deno,server-runtime-injection,server-utils}-10.67.0.tgz`)
instead of the recorded worktree symlinks; express 5.2.1, mysql 2.18.1, deno 2.9.0. Every recorded
verdict reproduced.

```
### 0. bare.ts (no Sentry)
PORT=41733
$ curl http://127.0.0.1:41733/users/42
{"id":"42"}

### 1. app-hook-only.ts (import hook, no jsonfix) — exit=1
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
var codes = require('./codes.json')
            ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Object.<anonymous> (.../M-express-deno/node_modules/statuses/index.js:15:13)

### 2. app.ts, hook + jsonfix, stream lifecycle (items-stream.json)
{"type":"event","exception":"Error: express boom","mechanism":"auto.http.express","handled":false,
 "sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"transaction":"GET /error",
 "trace_id":"d5f32b5699a542808ec7e5c43f3b58e6",
 "request":{"url":"http://127.0.0.1:41733/error","method":"GET"},"environment":"probe"}

{"type":"span","items":[
  {"n":"handler /users/:id","trace_id":"a4c3aca9cdd34086b45368a1ad4b6560","parent":"bc1c6ae8c82be71d","http_route":"/users/:id","origin":"auto.http.express"},
  {"n":"http.server GET /users/:id","trace_id":"a4c3aca9cdd34086b45368a1ad4b6560","http_route":"/users/:id","origin":"auto.http.server"}]}

{"type":"span","items":[
  {"n":"db SELECT users","trace_id":"88ff2299aa8440439d8d98287b71319a","parent":"a7e96ecf902da944","origin":"auto.db.mysql"},
  {"n":"handler /db","trace_id":"88ff2299aa8440439d8d98287b71319a","parent":"bd65f7f2c44c30e4","http_route":"/db","origin":"auto.http.express"},
  {"n":"http.server GET /db","trace_id":"88ff2299aa8440439d8d98287b71319a","http_route":"/db","origin":"auto.http.server"}]}

# /downstream — handler + http.server only, no http.client
{"type":"span","items":[
  {"n":"handler /downstream","trace_id":"cffb07b81c3f487d9b1897006fdd2d86","parent":"a845a4bf66720150","http_route":"/downstream","origin":"auto.http.express"},
  {"n":"http.server GET /downstream","trace_id":"cffb07b81c3f487d9b1897006fdd2d86","http_route":"/downstream","origin":"auto.http.server"}]}
$ curl http://127.0.0.1:41735/__seen
[{"url":"/rec","sentry-trace":null,"baggage":null}]

{"type":"log","items":["info: hello from express on deno"]}

# isolation
{"type":"event","exception":"Error: iso-gamma","tags":{"who":"gamma"},"trace_id":"8797f15262ac4dd78e83074e088d722c","transaction":"GET /iso/:tag","request":{"url":"http://127.0.0.1:41733/iso/gamma"}}
{"type":"event","exception":"Error: iso-alpha","tags":{"who":"alpha"},"trace_id":"98905046d7ca4d1db559c24dfdfcc4c7","transaction":"GET /iso/:tag","request":{"url":"http://127.0.0.1:41733/iso/alpha"}}
{"type":"event","exception":"Error: iso-beta","tags":{"who":"beta"},"trace_id":"64000f01854d429ea1a12d03797ba350","transaction":"GET /iso/:tag","request":{"url":"http://127.0.0.1:41733/iso/beta"}}

# incoming trace
{"type":"span","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","items":[
  {"n":"handler /users/:id","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"8ff1796933d83f9a","http_route":"/users/:id"},
  {"n":"http.server GET /users/:id","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"bbbbbbbbbbbbbbbb","http_route":"/users/:id"}]}

### 3. app.ts, LIFECYCLE=static (items-static.json)
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","spans":["handler /users/:id"]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","spans":["handler /error"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["handler /db","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","spans":["handler /downstream"]}

### 4. app-nohook.ts, LIFECYCLE=static (items-nohook.json)
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","spans":[]}
{"type":"log","items":["info: hello from express on deno"]}
# no event for the /error throw; only Express's stderr stack in app-nohook.log
```

Match: yes, for all seven capabilities (errors, route names, isolation, incoming trace, outgoing
fetch broken, db spans, logs) and for both the hook-only crash and the no-hook degradation. The only
deviations are cosmetic: the SDK was installed from the develop tarballs rather than worktree
symlinks, and the static/no-hook variants ran on ports 41736/41737 so they could run alongside the
stream app.

## Files

- `instrument.ts` — `@sentry/deno/import` + `./jsonfix.ts` + `Sentry.init` (LIFECYCLE env picks stream/static)
- `jsonfix.ts` — the denoland/deno#36240 workaround (second `Module.registerHooks({ load })`)
- `routes.ts` — Express app, module-scope `mysql` connection, all probe routes
- `app.ts` / `app-hook-only.ts` / `app-nohook.ts` / `bare.ts` — the four variants
- `sink.mjs` — envelope sink extended to keep span `parent_span_id`, `http.route` and `origin`
- `recorder.mjs` — downstream endpoint logging `sentry-trace` / `baggage`
- `items-stream.json`, `items-static.json`, `items-nohook.json` — the sink dumps quoted above
