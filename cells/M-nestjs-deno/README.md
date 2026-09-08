# M-nestjs-deno — NestJS 10 (@nestjs/platform-express) on Deno 2.9.0

## What it reproduces

NestJS 10 (`@nestjs/core` + `@nestjs/common` + `@nestjs/platform-express`) running on Deno 2.9.0 under
npm compat (`nodeModulesDir: "manual"`) with the develop (v11 line, 10.67.0) `@sentry/nestjs` SDK.
NestJS itself boots on Deno unchanged and `@sentry/nestjs` (i.e. `@sentry/node`) initializes fine, but
the develop SDK's default runtime injection makes the combination unbootable: `Sentry.init()` calls
`Module.registerHooks({resolve, load})` because `hasStableSyncModuleHooks()` returns `true`
unconditionally when `globalThis.Deno` is set, and in Deno 2.9.0 *any* `Module.registerHooks()` call
makes `require('*.json')` throw `SyntaxError: Unexpected token ':'` — which takes down `mysql2`,
`statuses`, `express` and every Nest HTTP adapter. The one lever that gets the app up is the
undocumented sentinel `globalThis.__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true }` set before
`init()`. With that workaround in place errors, request isolation, incoming trace continuation,
`mysql2` db spans and logs all work; route names are lost (transactions stay url-named, never
`/users/:id`) because the express/nest route-name instrumentation is channel-based, and the outgoing
global `fetch` gets neither a span nor propagation headers (the known Deno K2 gap) while `node:http`
from the same handler does.

## Install

```
npm install --no-audit --no-fund
```

(The `@sentry/*` deps resolve from `../../_toolbox/pack/*.tgz`, all built from `develop` at 10.67.0.
MariaDB must be reachable at `127.0.0.1:3307` — root, no password, db `app`, table `users`.)

## Run

```
cd $REPRO/cells/M-nestjs-deno

# sink (envelopes) + recorder (downstream propagation headers)
PORT=44822 node sink.mjs > sink.log 2>&1 &
PORT=44823 node recorder.mjs > recorder.log 2>&1 &

# 1) the Deno bug, isolated with a pass-through hook and zero Sentry code
deno run --no-prompt -A try-hooks-noop.mts     # -> STATUSES_FAIL Unexpected token ':'
deno run --no-prompt -A try-hooks-none.mts     # -> STATUSES_OK function

# 2) the SDK walking into it: default (injection ON) vs the workaround
SENTRY_DEBUG=1 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys try-express.ts
NO_INJECT=1 SENTRY_DEBUG=1 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys try-express.ts
NO_INJECT=1 deno run --no-prompt -A try-nestjs-sdk.ts    # -> SDK_OK true probe

# 3) the app with injection ON — does not boot
LIFECYCLE=static APP_PORT=44821 SINK_PORT=44822 REC_PORT=44823 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts

# 4) the app with the workaround, static lifecycle (transaction envelopes, nested spans[])
NO_INJECT=1 LIFECYCLE=static APP_PORT=44821 SINK_PORT=44822 REC_PORT=44823 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts &
APP_PORT=44821 SINK_PORT=44822 REC_PORT=44823 node drive.mjs > items-static.json

# 5) same, stream lifecycle (span envelopes)
NO_INJECT=1 LIFECYCLE=stream APP_PORT=44821 SINK_PORT=44822 REC_PORT=44823 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts &
APP_PORT=44821 SINK_PORT=44822 REC_PORT=44823 node drive.mjs > items-stream.json
```

`drive.mjs` hits `/users/42`, `/error`, `/downstream`, `/db`, `/log`, `/users/7` with an incoming
`sentry-trace`, three concurrent `/iso?tag=…`, then `/sentinel`, waits for the sentinel event and for
the ~7s log flush, and dumps the sink items plus the recorder's seen headers.

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works — with `SentryGlobalFilter` as `APP_FILTER`, a throw in a `@Get` handler arrives with mechanism `auto.http.nestjs.global_filter`, `handled:false`, sdk `sentry.javascript.nestjs`, transaction `GET /error`, the request's trace id and context lines. `SentryModule.forRoot()` alone registers only `APP_INTERCEPTOR` and Nest swallows the error. |
| route names | broken — `/users/42` gives transaction `GET /users/42` with source `url` (static) and span name `GET` with no source attribute (stream). `/users/:id` never appears and source is never `route`, because that instrumentation is channel-based and the injection has to be off for the app to boot. |
| isolation | works — three concurrent `/iso?tag=alpha\|beta\|gamma`, each `setTag` + 60-140ms await + `captureException`, give three events each carrying only its own `probe_tag` and three distinct trace ids matching what the handler read back from its own root span. |
| incoming trace | works — `sentry-trace: aaaa…aaaa-bbbbbbbbbbbbbbbb-1` yields a transaction with that trace id and `parent_span_id: bbbbbbbbbbbbbbbb`, in both lifecycles. |
| outgoing fetch | broken — global `fetch()` from a handler produces no `http.client` span and the recorder sees no `sentry-trace`/`baggage` (Deno K2). `node:http` from the same handler does work, span and headers both. |
| db spans | works — a module-scope `mysql2` pool queried in `/db` gives db spans with no instrumentation path at all, in fact with the channel injection explicitly disabled: mysql2 3.24.3 ships its own `node:diagnostics_channel` publisher and `@sentry/node`'s mysql2 integration subscribes to it. |
| logs | works — `Sentry.logger.info("hello from nestjs on deno", …)` arrives as `info: hello from nestjs on deno` on the request's trace id, after the ~7s flush. |
| client errors | not-run — server-only cell, no browser entry. |

Recorded evidence lines:

```
--- Deno bug isolated with a no-op hook, no Sentry involved:
with no-op registerHooks:  STATUSES_FAIL Unexpected token ':'
without hooks:             STATUSES_OK function

--- @sentry/nestjs default (injection ON) kills the app on Deno:
DB_INIT_ERROR SyntaxError: Unexpected token ':'
[Nest] ERROR [PackageLoader] No driver (HTTP) has been selected. ...
PLATFORM_EXPRESS_FAIL SyntaxError: Unexpected token ':'
    at wrapSafe (node:module:1666:21)
    at Object.<anonymous> (.../node_modules/statuses/index.js:15:13)
-- and with the workaround:
NO_INJECT=1 -> PLATFORM_EXPRESS_OK function / EXPRESS_OK function

--- debug log confirming the injection path taken on Deno (default run):
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
--- and with the workaround:
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans.

--- SINK, traceLifecycle: "static", NO_INJECT=1
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","traceId":"bf52922e59a64b0891fa9661611cf1c8","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","traceId":"fc94976a14cd4f08bb925e7fc041dd75","spans":[]}
{"type":"event","exception":"nest route boom","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.nestjs","transaction":"GET /error","traceId":"fc94976a14cd4f08bb925e7fc041dd75","hasContextLine":true}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","traceId":"92498e1bad9c462e8d5d07ef0a08a247","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","traceId":"f96e44ba2a7c497dbc0dd9e9e6174005","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /users/7","op":"http.server","source":"url","status":"ok","traceId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parentSpanId":"bbbbbbbbbbbbbbbb","spans":[]}
{"type":"event","exception":"iso alpha","mechanism":"generic","handled":true,"tags":{"probe_tag":"alpha"},"transaction":"GET /iso","traceId":"812bb374f9694c50be663c179398033c"}
{"type":"event","exception":"iso beta","mechanism":"generic","handled":true,"tags":{"probe_tag":"beta"},"transaction":"GET /iso","traceId":"6aa14dcce27c4abc848f2201940015b0"}
{"type":"event","exception":"iso gamma","mechanism":"generic","handled":true,"tags":{"probe_tag":"gamma"},"transaction":"GET /iso","traceId":"b92c2d4b421c4a3bb2c2ec9b7af95c2b"}
{"type":"log","items":["info: hello from nestjs on deno"]}
```

## Observed on 2026-09-07

Rebuilt and run once on Deno 2.9.0 / node v26.5.0, ports 44821 (app) / 44822 (sink) / 44823 (recorder).
**Every capability verdict matches the record.** Verbatim, trimmed:

```
--- Deno bug isolated with a pass-through hook, no Sentry (try-hooks-noop.mts / try-hooks-none.mts):
STATUSES_FAIL Unexpected token ':'
STATUSES_OK function

--- injection ON (try-express-inject.log):
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
PLATFORM_EXPRESS_FAIL SyntaxError: Unexpected token ':'
EXPRESS_FAIL Unexpected token ':'

--- injection OFF (try-express-noinject.log):
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans.
PLATFORM_EXPRESS_OK function
EXPRESS_OK function
SDK_OK true probe

--- the app with injection ON (app-inject-on.log): does not boot
SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Object.<anonymous> (.../node_modules/mysql2/lib/connection_config.js:13:21)

--- SINK, traceLifecycle "static", NO_INJECT=1 (items-static.json):
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"1d124ec845354333814b95e44689bde2","sdk":"sentry.javascript.nestjs","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"e0f28508f423438fbdba5b8c09c95625","spans":[]}
{"type":"event","exception":"Error: nest route boom","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.nestjs","hasContextLine":true,"transaction":"GET /error","trace_id":"e0f28508f423438fbdba5b8c09c95625"}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","trace_id":"f7af94325104480a8746bc106e68eab9","spans":["http.client GET http://127.0.0.1:44823/recorded-nodehttp"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"3684961e80f746b99ba4fa0166c070a7","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /users/7","op":"http.server","source":"url","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}
{"type":"event","exception":"Error: iso alpha","mechanism":"generic","handled":true,"tags":{"probe_tag":"alpha"},"transaction":"GET /iso","trace_id":"a130db8d2ae2422da58d73d095853600"}
{"type":"event","exception":"Error: iso beta","mechanism":"generic","handled":true,"tags":{"probe_tag":"beta"},"transaction":"GET /iso","trace_id":"d76b5a190ba74761870743d16dee11c3"}
{"type":"event","exception":"Error: iso gamma","mechanism":"generic","handled":true,"tags":{"probe_tag":"gamma"},"transaction":"GET /iso","trace_id":"544a06f2db214fa8999acbab8d47ade9"}
{"type":"log","items":["info: hello from nestjs on deno"]}
-- recorder (downstream headers):
{"url":"/recorded-fetch","sentry-trace":null,"baggage":null}
{"url":"/recorded-nodehttp","sentry-trace":"f7af94325104480a8746bc106e68eab9-84655e0e0f1f2ee1-1","baggage":"sentry-environment=probe,...,sentry-trace_id=f7af94325104480a8746bc106e68eab9,..."}

--- SINK, traceLifecycle "stream", NO_INJECT=1 (items-stream.json):
span: {"n":"http.server GET","trace_id":"90274d7bb8b847f49371e9407f59bd4c","origin":"auto.http.http_server"}
span: {"n":"http.client GET 127.0.0.1","trace_id":"957dc95297fe4d8681180fdde4dcb800","parent":"a803a3b4f1f9c7bc","origin":"auto.http.client"}
span: {"n":"db mysql2.pool.connect","trace_id":"07dbcc3b91764df8ab784ec695b7ea02","origin":"auto.db.mysql2.diagnostic_channel"}
span: {"n":"db SELECT users","trace_id":"07dbcc3b91764df8ab784ec695b7ea02","origin":"auto.db.mysql2.diagnostic_channel"}
span: {"n":"http.server GET","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"bbbbbbbbbbbbbbbb","origin":"auto.http.http_server"}
{"type":"log","items":["info: hello from nestjs on deno"]}   # log trace_id 4a425782b60b47f8857661342de55414 == the GET /log server span
```

Match: **yes** for all seven applicable capabilities (errors works, route names broken, isolation works,
incoming trace works, outgoing fetch broken with node:http working, db spans works, logs works);
`client errors` stays not-run.

Only cosmetic differences, none of them changing a verdict:

- With injection ON the boot dies at `mysql2/lib/connection_config.js` requiring `charset_encodings.json`
  rather than at `statuses/index.js`, so the log shows an unhandled `SyntaxError` instead of the
  record's caught `DB_INIT_ERROR` + `[PackageLoader] No driver (HTTP) has been selected`. Same
  `SyntaxError: Unexpected token ':'`, same cause, different first victim: this rebuild imports
  `mysql2/promise` at controller module scope, so it is reached before the Nest HTTP adapter is.
- The rebuilt `sink.mjs` (copied from `M-express-deno`) emits `trace_id` / `parent_span_id` where the
  recorded sink emitted `traceId` / `parentSpanId`, and prefixes exception values with the error type.
- `try-express.ts` here also reports `EXPRESS_FAIL` for a bare `express` import under injection; the
  record only quoted the `@nestjs/platform-express` line.
- Trace ids and the two extra `db mysql2.connect` / `http.client` lines differ per run, as expected.
