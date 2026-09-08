# M-express-bun — Express 4.22.1 on Bun

## What it reproduces

Express 4 running on Bun with the develop Sentry SDK (`@sentry/bun` 10.67.0, v11 line), showing that
every framework-level capability depends on the `Bun.build` + `sentryBunPlugin()` bundle step. Built
with the plugin and run as `bun dist/app.js`, the app gets automatic error capture for a throwing
route (mechanism `auto.http.express`), parameterized route names (`GET /users/:id`, source `route`),
per-request isolation of tags across concurrent handlers, incoming `sentry-trace` continuation,
`http.client` spans with propagation headers on an outgoing `fetch`, `mysql@2` db spans from a
module-scope connection, and log envelopes. Run un-bundled (`bun app.ts`) the same code serves fine
but reports url-sourced transaction names, no middleware/handler/db spans and no error event at all.

## Install

```
npm install
```

(the `@sentry/*` deps are the develop tarballs under `../../_toolbox/pack/`)

## Run

```
D=$REPRO/cells/M-express-bun

# sink (envelopes + the headers of the handler's outgoing fetch, at /__record)
cd $D && PORT=47231 node sink.mjs > sink.log 2>&1 & sinkpid=$!

# build once
cd $D && bun build.ts                       # -> success true, dist/app.js

# bundled run, stream lifecycle (span envelopes)
cd $D && SINK_PORT=47231 PORT=0 LIFECYCLE=stream bun dist/app.js > app.log 2>&1 & apppid=$!
# app.log prints PORT=<n>
cd $D && node drive.mjs <n> 47231           # errors, routes, db, fetch, incoming trace, 3x iso, log, sentinel

# bundled run, static lifecycle (transaction envelopes with nested spans[])
cd $D && SINK_PORT=47231 PORT=0 LIFECYCLE=static bun dist/app.js > app-static.log 2>&1 & apppid=$!
cd $D && node drive.mjs <n> 47231

# un-bundled contrast
cd $D && SINK_PORT=47231 PORT=0 LIFECYCLE=static bun app.ts > app-plain.log 2>&1 & apppid=$!
cd $D && node drive.mjs <n> 47231

kill $apppid; kill $sinkpid
```

`drive.mjs` clears nothing; clear the sink between runs with
`curl -s -X DELETE http://127.0.0.1:47231/__items`.

## Expected

Recorded verdict: all seven capabilities `works`, from the bundled run, in both lifecycles.

- errors — works: single event, mechanism `auto.http.express`, handled:false, transaction `GET /boom`,
  context lines; transaction still sent with status `internal_error`.
- route names — works: static gives `GET /users/:id` source `route`; stream gives span
  `http.server GET /users/:id` with `http.route`, children `handler /users/:id`, `middleware expressInit`,
  `middleware query2`.
- isolation — works: three concurrent `/iso/{alpha,beta,gamma}`, each with its own tag and trace id.
- incoming trace — works: `sentry-trace: aabbccddeeff00112233445566778899-1122334455667788-1` continued.
- outgoing fetch — works: `http.client` span inside `/fetchout`, recorder sees `sentry-trace` + baggage
  with `sentry-transaction=GET%20%2Ffetchout`. Stream names it `GET 127.0.0.1`, static describes the URL.
- db spans — works: static `db SELECT id, name FROM users LIMIT 2`, stream `db SELECT users`.
- logs — works: `info: hello from express on bun` after the ~7s flush.

Recorded evidence lines:

```
PORT=59907 injected=["express","mysql"]
{"type":"event","exception":"express boom","mechanism":"auto.http.express","handled":false,"sdk":"sentry.javascript.bun","transaction":"GET /boom","trace_id":"9cd11af663f4485a836e182f5f292762","parent_span_id":"92772e87c616ec53","hasContextLine":true}
{"type":"event","exception":"iso alpha","mechanism":"generic","handled":true,"transaction":"GET /iso/:tag","tags":{"who":"alpha"},"trace_id":"c666bff36237403ab08628aecc42a87c"}
{"type":"span","items":[{"n":"middleware expressInit"},{"n":"middleware query2"},{"n":"handler /users/:id","http_route":"/users/:id"},{"n":"http.server GET /users/:id","http_route":"/users/:id"}]}
{"type":"span","items":[{"n":"middleware expressInit"},{"n":"middleware query2"},{"n":"db SELECT users",...},{"n":"handler /db","http_route":"/db"},{"n":"http.server GET /db","http_route":"/db"}]}
{"type":"span","items":[{"n":"http.client GET 127.0.0.1",...},{"n":"handler /fetchout","http_route":"/fetchout"},{"n":"http.server GET /fetchout","http_route":"/fetchout"}]}
TRACE-CONT: [{"n":"handler /users/:id","trace_id":"aabbccddeeff00112233445566778899","parent_span_id":"b0577b11b2dbeb0b","http_route":"/users/:id"},{"n":"http.server GET /users/:id","trace_id":"aabbccddeeff00112233445566778899","parent_span_id":"1122334455667788","http_route":"/users/:id"}]
LOG: ["info: hello from express on bun"]
[{"url":"/__record?from=express","sentryTrace":"2817899b6fd647c398bd057b026b532b-b6dd3e4e19fed040-1","baggage":"...sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,..."}]
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","spans":["middleware query2","middleware expressInit","handler /users/:id"]}
```

## Observed on 2026-09-07

Bun 1.4.2 (the record used 1.4.0), `bun build.ts` -> `success true`. All seven capabilities match the
recorded verdict. Two cosmetic differences, both explained below the output.

Bundled, stream lifecycle:

```
PORT=60725 injected={}
{"type":"event","exception":"Error: express boom","mechanism":"auto.http.express","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"transaction":"GET /boom","trace_id":"c00cb0b1d20b4003a073f8cbcd019c42"}
{"type":"event","exception":"Error: iso alpha","mechanism":"generic","handled":true,"transaction":"GET /iso/:tag","tags":{"who":"alpha"},"trace_id":"3605df3a4e434f2fb11be2b4f326f216"}
{"type":"event","exception":"Error: iso beta","mechanism":"generic","handled":true,"transaction":"GET /iso/:tag","tags":{"who":"beta"},"trace_id":"2734a74a333b4f0dbb6260f3e2628503"}
{"type":"event","exception":"Error: iso gamma","mechanism":"generic","handled":true,"transaction":"GET /iso/:tag","tags":{"who":"gamma"},"trace_id":"163828dc765d4c479a2984495d450812"}
{"type":"span","items":[{"n":"middleware expressInit"},{"n":"middleware query"},{"n":"handler /users/:id","http_route":"/users/:id"},{"n":"http.server GET /users/:id","is_segment":true,"http_route":"/users/:id"}]}
{"type":"span","items":[{"n":"handler /boom","status":"error","http_route":"/boom"},{"n":"middleware expressInit"},{"n":"middleware query"},{"n":"http.server GET /boom","status":"error","is_segment":true,"http_route":"/boom"}]}
{"type":"span","items":[{"n":"middleware expressInit"},{"n":"middleware query"},{"n":"db SELECT users","origin":"auto.db.mysql","dbtext":"SELECT id, name FROM users LIMIT 2"},{"n":"handler /db","http_route":"/db"},{"n":"http.server GET /db","http_route":"/db"}]}
{"type":"span","items":[{"n":"middleware expressInit"},{"n":"middleware query"},{"n":"http.client GET 127.0.0.1","origin":"auto.http.fetch"},{"n":"handler /fetchout","http_route":"/fetchout"},{"n":"http.server GET /fetchout","http_route":"/fetchout"}]}
{"type":"span","items":[{"n":"handler /users/:id","trace_id":"aabbccddeeff00112233445566778899","http_route":"/users/:id"},{"n":"http.server GET /users/:id","trace_id":"aabbccddeeff00112233445566778899","parent_span_id":"1122334455667788","is_segment":true,"http_route":"/users/:id"}]}
["info: hello from express on bun"]
[{"url":"/__record?from=express","sentryTrace":"226e4c8e1c8d439f9b006d23a9c6f693-beebd05b2814dfb7-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=226e4c8e1c8d439f9b006d23a9c6f693,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.3614964575757148,sentry-sample_rate=1"}]
```

Bundled, static lifecycle:

```
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","spans":["middleware query","middleware expressInit","handler /users/:id"]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","spans":["middleware query","middleware expressInit","handler /boom"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["middleware query","middleware expressInit","handler /db","db SELECT id, name FROM users LIMIT 2"]}
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","spans":["middleware query","middleware expressInit","handler /fetchout","http.client GET http://127.0.0.1:47231/__record"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aabbccddeeff00112233445566778899","parent_span_id":"1122334455667788","spans":["middleware query","middleware expressInit","handler /users/:id"]}
{"tx": "GET /iso/:tag", "tags": {"who": "alpha"}}
{"tx": "GET /iso/:tag", "tags": {"who": "beta"}}
{"tx": "GET /iso/:tag", "tags": {"who": "gamma"}}
```

Un-bundled contrast (`bun app.ts`, static), also as recorded — no `express boom` event at all, source
`url`, no middleware/handler/db spans, logs still delivered:

```
PORT=61348 injected=undefined
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"url","status":"ok","spans":["http.client GET http://127.0.0.1:47231/__record"]}
["info: hello from express on bun"]
```

Differences from the record, neither affecting a verdict:

1. The startup line prints `injected={}` instead of `injected=["express","mysql"]`. The channels are
   demonstrably injected (express and mysql spans are present), so on Bun 1.4.2 the shape of
   `globalThis.__SENTRY_ORCHESTRION__.bundler` is no longer the array the record logged.
2. The express query middleware span is named `middleware query`, the record has `middleware query2`.
