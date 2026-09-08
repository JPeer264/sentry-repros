# M-elysia-bun — Elysia 1.4 with @sentry/elysia on Bun

## What it reproduces

An Elysia 1.4 app on Bun instrumented with `@sentry/elysia` 10.67.0 (the `develop` / v11 line, built from
`getsentry/sentry-javascript@6f2da7483d`), wired exactly as a docs page would show it: `Sentry.init` in
`instrument.ts`, `import './instrument'` as the first line of the entry, and `Sentry.withElysia(new Elysia())`
wrapping the fresh app before any route is chained. No adapter, no `--preload` flag, no
`@elysiajs/opentelemetry`, no bundler. The app exercises errors (`/boom`), parameterised route names
(`/users/:id`), per-request scope isolation (`/iso/:tag`), incoming trace continuation, outgoing `fetch`
propagation (`/fetchout`), database spans with a module-scope `mysql2` pool (`/db`) and structured logs
(`/log`), in both the `stream` (default) and `static` trace lifecycles. `app2.ts` plus `build.ts` cover the
`mysql`@2 delta: that driver publishes no `node:diagnostics_channel` events itself, so it needs a
`Bun.build` pass with `sentryBunPlugin()`. `sdkcheck.ts` prints the client's SDK metadata and integration
list, which carry the two recorded SDK bugs (`sdk.name` is `sentry.javascript.bun`, and the Bun
`BunHttpServer` integration is not filtered out).

## Install

```
cd $REPRO/cells/M-elysia-bun
npm install
```

(`package.json` points the seven `@sentry/*` deps at the `develop` tarballs in `../../_toolbox/pack/`;
`npm`, not `bun add`, because `bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps.
Bun then reads the resulting `node_modules` fine.)

## Run

MariaDB must be up on `127.0.0.1:3307` (root, no password, db `app`, table `users`).

```
cd $REPRO/cells/M-elysia-bun

# envelope sink (extended: span op | name | source | http.route | trace | parent,
# and /__rec records inbound sentry-trace/baggage, /__recorded reads them back)
PORT=41999 node sink2.mjs > sink.log 2>&1 & echo $! > sink.pid

# viability without Sentry
APP_PORT=41371 bun bare.ts

# stream lifecycle (develop default)
APP_PORT=41372 bun app.ts
# static lifecycle
LIFECYCLE=static APP_PORT=41373 bun app.ts

curl -s http://127.0.0.1:41372/users/42
curl -s http://127.0.0.1:41372/boom
curl -s http://127.0.0.1:41372/iso/aaa & curl -s http://127.0.0.1:41372/iso/bbb & curl -s http://127.0.0.1:41372/iso/ccc & wait
curl -s -D - -H 'sentry-trace: aaaabbbbccccddddeeeeffff00001111-1234567890abcdef-1' \
        -H 'baggage: sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-environment=probe,sentry-public_key=abc123,sentry-sample_rate=1' \
        http://127.0.0.1:41372/users/7 -o /dev/null
curl -s http://127.0.0.1:41372/fetchout ; curl -s http://127.0.0.1:41999/__recorded
curl -s http://127.0.0.1:41372/db ; curl -s http://127.0.0.1:41372/log
curl -s http://127.0.0.1:41372/sentinel        # sentinel: everything sent before it has arrived
curl -s http://127.0.0.1:41999/__items | python3 -m json.tool

# mysql@2 delta
LIFECYCLE=static APP_PORT=41374 bun app2.ts          # no db span
bun build.ts                                          # Bun.build + sentryBunPlugin -> dist/app2.js
LIFECYCLE=static APP_PORT=41375 bun dist/app2.js      # db span appears

# defaults / sdk metadata check
bun sdkcheck.ts
```

`dist/` is kept so the bundled variant runs without a rebuild (`bun dist/app2.js`, 11 MB).

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | partial (mysql2 works without a plugin; mysql@2 needs the Bun build plugin) |
| logs | works |
| sdk name | broken (`sentry.javascript.bun`, never `sentry.javascript.elysia`) |

Recorded evidence lines:

```
stream lifecycle, GET /users/42 (span envelope items):
  "middleware | Request | src=- | route=- | trace=40434eddc6504e19ba3d3ef16fcc37de | parent=aad145a139236cad"
  "handler | /users/:id | src=- | route=/users/:id | trace=40434eddc6504e19ba3d3ef16fcc37de | parent=aad145a139236cad"
  "http.server | GET /users/:id | src=route | route=/users/:id | trace=40434eddc6504e19ba3d3ef16fcc37de | parent=-"

errors (stream):
  {"type":"event","exception":"elysia-boom","mechanism":"auto.http.elysia.on_error","handled":false,
   "sdk":"sentry.javascript.bun","sdkVersion":"10.67.0","runtime":{"name":"bun","version":"1.4.0"},
   "hasContextLine":true,"transaction":"GET /boom","trace_id":"6ec5a8fa1e8f46b0976067936831a291",
   "request":"http://127.0.0.1:41372/boom"}

isolation (3 concurrent /iso/:tag):
  iso-aaa | tags= {'reqtag': 'aaa'} | trace= 8783b116e89b4d72bc9f4a5a34d7e228 | tx= None
  iso-bbb | tags= {'reqtag': 'bbb'} | trace= b487cebf564a4d998109f0a6242988c4 | tx= None
  iso-ccc | tags= {'reqtag': 'ccc'} | trace= 343c8eaea5ee4bcab6dd09ef6a7f898d | tx= None

incoming trace (request header sentry-trace: aaaabbbbccccddddeeeeffff00001111-1234567890abcdef-1):
  response headers:
    sentry-trace: aaaabbbbccccddddeeeeffff00001111-8e0c7328139f307f-1
    baggage: sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-environment=probe,...
  "http.server | GET /users/:id | src=route | route=/users/:id | trace=aaaabbbbccccddddeeeeffff00001111 | parent=1234567890abcdef"

outgoing fetch:
  "http.client | GET 127.0.0.1 | src=- | route=- | trace=d1354e5ae7c54038bcdb947bb02512a6 | parent=8861e4832343cfd5"
  recorder saw:
  {"url":"/__rec?from=elysia",
   "sentryTrace":"a4a35f89b3ac49d68202f83fd9e0f2f0-ac638829e494ad57-1",
   "baggage":"sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=a4a35f89b3ac49d68202f83fd9e0f2f0,sentry-org_id=1,sentry-sampled=true,sentry-sample_rand=0.5795107124891599,sentry-sample_rate=1"}

db, mysql2, no plugin (stream):
  "db | mysql2.pool.connect | ... | trace=62155e518d1d4bf5b10b64a334db66d7 | parent=a3af408841d92fd9"
  "db | mysql2.connect | ..."
  "db | SELECT users | ..."

logs:
  {"type":"log","items":["info: elysia-log-line"]}

static lifecycle, full transactions:
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok",
   "sdk":"sentry.javascript.bun",
   "spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform",
            "middleware BeforeHandle","handler Handle","middleware AfterHandle","middleware sentryOnAfterHandle",
            "middleware MapResponse"]}
  {"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error",
   "spans":[...,"handler Handle","middleware Error","middleware sentryOnError"]}
  {"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok",
   "spans":[...,"handler Handle","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users",...]}
```

## Observed on 2026-09-07

Rebuilt and run once. Every recorded verdict reproduced. The one environmental difference: this machine now
has **bun 1.4.2**, not the recorded 1.4.0, so `contexts.runtime.version` reads `1.4.2`. Nothing else differs.

errors — works:

```
{"type":"event","exception":"Error: elysia-boom","mechanism":"auto.http.elysia.on_error","handled":false,
 "sdk":"sentry.javascript.bun","sdkVersion":"10.67.0","runtime":{"name":"bun","version":"1.4.2"},
 "hasContextLine":true,"transaction":"GET /boom","trace_id":"0c596933afd644148477b6dd3180de21",
 "request":"http://127.0.0.1:41372/boom"}
```

route names — works (stream lifecycle, GET /users/42):

```
middleware | Request | src=- | route=- | trace=90136e5d6b614dad9a55b86439ab5f19 | parent=b08b7b1c8f0152fd
handler | /users/:id | src=- | route=/users/:id | trace=90136e5d6b614dad9a55b86439ab5f19 | parent=b08b7b1c8f0152fd
http.server | GET /users/:id | src=route | route=/users/:id | trace=90136e5d6b614dad9a55b86439ab5f19 | parent=-
```

isolation — works (3 concurrent /iso/:tag; `tx= None` nit reproduced):

```
iso-bbb | tags= {'reqtag': 'bbb'} | trace= 108f36e50abb4f68a4c6425d541383c5 | tx= None
iso-ccc | tags= {'reqtag': 'ccc'} | trace= 6bc9144ac9b7421a8472e192bd9924d2 | tx= None
iso-aaa | tags= {'reqtag': 'aaa'} | trace= b67e89b0c40640f0bb59fb3b8cdaba6d | tx= None
```

incoming trace — works:

```
sentry-trace: aaaabbbbccccddddeeeeffff00001111-83e60bf1bb6e03a3-1
baggage: sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-environment=probe,sentry-public_key=abc123,sentry-sample_rate=1,sentry-sample_rand=0.6929287559696768
http.server | GET /users/:id | src=route | route=/users/:id | trace=aaaabbbbccccddddeeeeffff00001111 | parent=1234567890abcdef
```

outgoing fetch — works:

```
http.client | GET 127.0.0.1 | src=- | route=- | trace=e72c8606969541598468a16a158e99db | parent=9f9f957edb4c7ed3
{"url":"/__rec?from=elysia",
 "sentryTrace":"e72c8606969541598468a16a158e99db-b9f47ad662ee1e85-1",
 "baggage":"sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=e72c8606969541598468a16a158e99db,sentry-org_id=1,sentry-sampled=true,sentry-sample_rand=0.27614310784880003,sentry-sample_rate=1"}
```

db spans — partial, as recorded. mysql2 module-scope pool, no plugin (stream):

```
db | mysql2.pool.connect | src=- | route=- | trace=a64a4a670b2a42e7880c54225ba39ec8 | parent=aca966417887ff71
db | mysql2.connect | src=- | route=- | trace=a64a4a670b2a42e7880c54225ba39ec8 | parent=b9305b2d8a2da8ce
db | SELECT users | src=- | route=- | trace=a64a4a670b2a42e7880c54225ba39ec8 | parent=aca966417887ff71
```

mysql@2, `bun app2.ts` (no db span) then `bun dist/app2.js` after `bun build.ts` (db span):

```
{"name": "GET /db2", "status": "ok", "spans": ["middleware Request", "middleware sentryOnRequest", "middleware Parse", "middleware Transform", "middleware BeforeHandle", "handler Handle", "middleware AfterHandle", "middleware sentryOnAfterHandle", "middleware MapResponse"]}
{"name": "GET /db2", "status": "ok", "spans": ["middleware Request", "middleware sentryOnRequest", "middleware Parse", "middleware Transform", "middleware BeforeHandle", "handler Handle", "db SELECT id, name FROM users", "middleware AfterHandle", "middleware sentryOnAfterHandle", "middleware MapResponse"]}
```

logs — works:

```
{"type": "log", "items": ["info: elysia-log-line"]}
```

static lifecycle — matches:

```
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "sdk": "sentry.javascript.bun", "spans": ["middleware Request", "middleware sentryOnRequest", "middleware Parse", "middleware Transform", "middleware BeforeHandle", "handler Handle", "middleware AfterHandle", "middleware sentryOnAfterHandle", "middleware MapResponse"]}
{"type": "transaction", "name": "GET /boom", "op": "http.server", "source": "route", "status": "internal_error", "sdk": "sentry.javascript.bun", "spans": [..., "handler Handle", "middleware Error", "middleware sentryOnError"]}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "sdk": "sentry.javascript.bun", "spans": [..., "handler Handle", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users", ...]}
```

sdk name — broken, as recorded; the `BunHttpServer` filter bug is visible in the same output:

```
sdk metadata: {"name":"sentry.javascript.bun","packages":[{"name":"npm:@sentry/bun","version":"10.67.0"}],"version":"10.67.0"}
traceLifecycle: stream
integrations: EventFilters, FunctionToString, LinkedErrors, RequestData, Console, Http, Fetch, OnUncaughtException, OnUnhandledRejection, ContextLines, Context, Modules, ProcessSession, Express, Fastify, Hapi, Koa, BunHttpServer, Graphql, Mongo, Mongoose, Mysql, Mysql2, Redis, Postgres, Prisma, Tedious, GenericPool, Kafka, Amqplib, LruMemoizer, Aws, LangChain, LangGraph, VercelAI, OpenAI, Anthropic_AI, Google_GenAI, PostgresJs, Firebase, SpanStreaming
```

Full captures from this run: `items-stream.json`, `items-static.json`, `sdkcheck.log`.
