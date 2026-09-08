# M-nestjs-bun

NestJS 11 (`@nestjs/core` + `@nestjs/platform-express`) on Bun 1.4.0 with `@sentry/nestjs` +
`@sentry/bun`, SDK `develop` 10.67.0 tarballs.

## What it reproduces

NestJS boots and serves on Bun unchanged, and the Sentry story splits sharply on whether you bundle.
Run straight from source (`bun src/main.ts`) you get errors with the `auto.http.nestjs.global_filter`
mechanism, request isolation, incoming trace continuation, an outgoing `fetch` span with
`sentry-trace`/`baggage`, and logs, but the server transaction is URL-named (`GET /users/42`, source
`url`) with no child spans at all, so no express middleware/handler spans and no mysql span, and
nothing warns about it. Built with `Bun.build` + `sentryBunPlugin()` the same app produces
`GET /users/:id` with source `route`, express `middleware`/`handler` children and the
`db SELECT id, name FROM users` child. The one Nest-specific build step is the `external` list in
`build.ts`: Bun's bundler statically resolves Nest's `loadPackage()` requires, so
`@nestjs/microservices`, `@nestjs/websockets`, `class-validator`, `class-transformer` and
`cache-manager` must be externalized or the build fails outright. `SentryGlobalFilter` is not
optional either: with the `APP_FILTER` provider removed, a controller throw yields only a
`GET /error internal_error` transaction and no event.

## Install

```
S=$SCRATCH
cd $REPRO/cells/M-nestjs-bun
npm install --no-audit --no-fund $S/pack/sentry-nestjs-10.67.0.tgz $S/pack/sentry-bun-10.67.0.tgz \
  $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  @nestjs/core@11 @nestjs/common@11 @nestjs/platform-express@11 reflect-metadata rxjs mysql
```

(The same tarballs are mirrored in `$REPRO/_toolbox/pack`.)
`bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps, so install with npm and
run with bun. MariaDB must be up on `127.0.0.1:3307` (root, no password, db `app`, table `users`).

## Run

```
D=$REPRO/cells/M-nestjs-bun
cd $D

# sink (extended: keeps tags and trace ids, plus a /rec recorder and /__rec readout)
PORT=41501 node sink.mjs > sink.log 2>&1 &

# 1. unbundled baseline
SINK_PORT=41501 PORT=41502 LIFECYCLE=static bun src/main.ts > app-unbundled.log 2>&1 &
SINK_PORT=41501 PORT=41502 node drive.mjs > drive-unbundled.json

# 2. bundled, static lifecycle (transaction envelopes with nested spans[])
bun run build.ts
SINK_PORT=41501 PORT=41503 LIFECYCLE=static bun dist/main.js > app-bundled.log 2>&1 &
SINK_PORT=41501 PORT=41503 node drive.mjs > drive-bundled.json

# 3. bundled, stream lifecycle (span envelopes)
SINK_PORT=41501 PORT=41504 LIFECYCLE=stream bun dist/main.js > app-stream.log 2>&1 &
SINK_PORT=41501 PORT=41504 node drive.mjs > drive-stream.json

# 4. control: SentryGlobalFilter removed
SINK_PORT=41501 PORT=41505 LIFECYCLE=static NO_FILTER=1 bun dist/main.js > app-nofilter.log 2>&1 &
curl -s -X DELETE http://127.0.0.1:41501/__items
curl -s http://127.0.0.1:41505/error; curl -s http://127.0.0.1:41505/sentinel
curl -s http://127.0.0.1:41501/__items
```

`drive.mjs` drives every route from a plain `node` process (a `fetch` from a Sentry-initialized
process would mark the server transaction unsampled), waits for the `sentinel` event, then waits 7s
for the log flush and prints `{ items, rec }`.

`dist/` is checked in (14 MB) and runs standalone, so step 2/3 work without re-running `build.ts`.

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | partial (route names only in the bundled build) |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | partial (mysql span only in the bundled build) |
| logs | works |
| client errors | not-run (headless HTTP API, no browser surface) |

Recorded evidence lines (bundled, `LIFECYCLE=static`):

```
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /users/:id"]}
{"type":"event","exception":"nest boom","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.bun","transaction":"GET /error","hasContextLine":true}
{"type":"event","exception":"iso a","mechanism":"generic","handled":true,"transaction":"GET /isolated","tags":{"req":"a"},"trace_id":"7ff43753d3504494b39bf8fab2162c8e"}
{"type":"event","exception":"iso b","mechanism":"generic","handled":true,"transaction":"GET /isolated","tags":{"req":"b"},"trace_id":"022ba12bfb964e1783cead47d1816090"}
{"type":"event","exception":"iso c","mechanism":"generic","handled":true,"transaction":"GET /isolated","tags":{"req":"c"},"trace_id":"3d7ddcc44efa46bfbc0de532a0b0d556"}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /db","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","spans":["...","handler /downstream","http.client GET http://127.0.0.1:53101/rec/downstream"]}
{"type":"log","items":["info: hello from nest on bun"]}
recorder /__rec:
{"url":"/rec/downstream","sentryTrace":"7464d41b2198425dbc45549f91f3e457-9f6ac91dc1ace759-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=7464d41b2198425dbc45549f91f3e457,sentry-org_id=1,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rate=1"}
```

Bundled, `LIFECYCLE=stream`:

```
SPAN http.server GET /users/:id | trace= 9b8c11e40b0240b6be5e3fc469d85865 | parent= None
SPAN handler /users/:id | trace= 9b8c11e40b0240b6be5e3fc469d85865 | parent= a3801f9c74f1aceb
SPAN db SELECT users | trace= 8ba37e3ff79a46a1a07aaac2f63b1555 | parent= a15df07c9dde9746
SPAN http.client GET 127.0.0.1 | trace= b658949e286545ef9d59f11cbda12567 | parent= b57d923bd3b57d4e
SPAN http.server GET /users/:id | trace= aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | parent= bbbbbbbbbbbbbbbb
```

Unbundled (`bun src/main.ts`), `LIFECYCLE=static`:

```
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","spans":["http.client GET http://127.0.0.1:53101/rec/downstream"]}
{"type":"event","exception":"nest boom","mechanism":"auto.http.nestjs.global_filter","handled":false,"transaction":"GET /error"}
```

## Observed on 2026-09-07

Rebuilt and run once on Bun 1.4.0, macOS arm64, SDK `develop` 10.67.0 tarballs. Every capability
matches the recorded verdict; only trace ids and the sink port differ (41501 here, 53101 in the
record). Full output in `drive-unbundled.json`, `drive-bundled.json`, `drive-stream.json`.

Boot on Bun, unchanged (`app-unbundled.log`):

```
[Nest] [RouterExplorer] Mapped {/users/:id, GET} route
[Nest] [NestApplication] Nest application successfully started
```

Bundled, `LIFECYCLE=static` (`drive-bundled.json`, trimmed):

```
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"550d414bbed2466e8e586e58cf568af2","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /users/:id"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /users/:id"]}
{"type":"event","exception":"Error: nest boom","mechanism":"auto.http.nestjs.global_filter","handled":false,"hasContextLine":true,"transaction":"GET /error","trace_id":"7286dcc624ed49f684f6e104a08f6cc9"}
{"type":"event","exception":"Error: iso a","mechanism":"generic","handled":true,"transaction":"GET /isolated","trace_id":"67f1a8bea38a4fffab317cd9d0229198","tags":{"req":"a"}}
{"type":"event","exception":"Error: iso b","mechanism":"generic","handled":true,"transaction":"GET /isolated","trace_id":"89fad2b48c9945f7b8a7f3481e4cd2c1","tags":{"req":"b"}}
{"type":"event","exception":"Error: iso c","mechanism":"generic","handled":true,"transaction":"GET /isolated","trace_id":"322eddb09513497e8ac316fe2b06e554","tags":{"req":"c"}}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /db","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /downstream","http.client GET http://127.0.0.1:41501/rec/downstream"]}
{"type":"log","items":["info: hello from nest on bun"]}
REC [{"url":"/rec/downstream","sentryTrace":"b8b281d5cd2f494fb936cbadafe23c4a-aa6bd9deeea6ad42-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=b8b281d5cd2f494fb936cbadafe23c4a,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rand=0.022074345922327043,sentry-sample_rate=1"}]
```

Bundled, `LIFECYCLE=stream` (`drive-stream.json`, trimmed):

```
SPAN http.server GET /users/:id | trace= 523161c1c8d94e92827281605ab0a20a | parent= None
SPAN handler /users/:id | trace= 523161c1c8d94e92827281605ab0a20a | parent= 933b8138efed6f22
SPAN http.server GET /users/:id | trace= aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | parent= bbbbbbbbbbbbbbbb
SPAN db SELECT users | trace= f8f6f4f4e9d044d49a102affaab2493d | parent= 9deaecd20462ec32
SPAN http.client GET 127.0.0.1 | trace= a14095d1f6394317ba1d4dc220cb20f0 | parent= 8bb0113ce2e1b3e0
```

Unbundled (`bun src/main.ts`), `LIFECYCLE=static` (`drive-unbundled.json`, trimmed):

```
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","spans":["http.client GET http://127.0.0.1:41501/rec/downstream"]}
{"type":"event","exception":"Error: nest boom","mechanism":"auto.http.nestjs.global_filter","handled":false,"hasContextLine":true,"transaction":"GET /error"}
{"type":"log","items":["info: hello from nest on bun"]}
```

Control, `NO_FILTER=1` (bundled) after `GET /error` + sentinel, the whole sink:

```
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /error"]}
{"type":"event","message":"sentinel","mechanism":"generic","handled":true,"transaction":"GET /sentinel"}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","spans":["..."]}
```

Differences from the record, all cosmetic: the recorded baggage carries `sentry-org_id=1` where this
run carries `sentry-sample_rand=...` (a DSN/sink difference, not a behavior change), and the
unbundled run also emits an `http.server` transaction for `GET /error` with source `url` alongside
the event, which the record's trimmed excerpt did not list.
