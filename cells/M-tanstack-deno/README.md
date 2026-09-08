# M-tanstack-deno — TanStack Start (React) on Deno

## What it reproduces

A standard TanStack Start (React) 1.168.35 app (`@tanstack/react-router` 1.170.18, nitro
3.0.260903-beta `node` output) instrumented with `@sentry/tanstackstart-react` 10.67.0 built from the
`develop` line, built with `vite build` and then run under **deno 2.9.0** instead of node. Deno has no
`node --import`, so the SDK is initialised by a two-line entry (`.output/server/deno-entry.mjs`) placed
next to the nitro output that imports `instrument.server.mjs` first and `index.mjs` second. The app
exercises seven capabilities through file-based API routes and SSR page routes: thrown errors, server
transaction route names, per-request scope isolation, incoming `sentry-trace` continuation, an outgoing
`fetch()` from a handler, a module-scope `mysql` query, and `Sentry.logger.info`. `vite.config.ts`
carries a required build workaround (a pre-plugin that externalises every `@sentry/*` import outside the
client environment behind a virtual shim with a default export); without it `vite build` fails outright
with this dependency set, because nitro's SSR rollup pass resolves `@sentry/*` to their CJS builds while
resolving what those files `require()` to ESM.

## Install

```
cd $REPRO/cells/M-tanstack-deno
npm install --no-audit --no-fund
node node_modules/esbuild/install.js && node node_modules/@swc/core/postinstall.js
```

(`package.json` pins every `@sentry/*` dependency to the develop tarballs in
`../../_toolbox/pack/sentry-*-10.67.0.tgz`. No registry version of `@sentry/*` is installed.)

## Run

```
cd $REPRO/cells/M-tanstack-deno
npm run build          # vite build, then copies instrument.server.mjs + deno-entry.mjs into .output/server

# one command: starts the envelope sink (47313), the fetch recorder (47315) and the
# nitro node output under deno (47311), drives all seven probes, prints /__items, stops everything
SUFFIX=rebuild bash ./run-probes.sh
```

The sink alone, if you want to drive it by hand:

```
PORT=47313 node $REPRO/_toolbox/sink.mjs      # or ./sink.mjs, which keeps trace ids and tags
PORT=47315 node ./recorder.mjs
cd .output/server && PORT=47311 PROBE_TUNNEL=http://127.0.0.1:47313/ \
  PROBE_RECORDER=http://127.0.0.1:47315/rec PROBE_LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi deno-entry.mjs
```

MariaDB must be listening on 127.0.0.1:3307 (root, no password, database `app`, table `users(id, name)`).

## Expected

Recorded verdicts (cell `M-tanstack-deno`, `traceLifecycle: 'static'`):

| capability | verdict |
| --- | --- |
| errors | works |
| route names | **broken** |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** |
| db spans | works |
| logs | works |

Recorded evidence lines:

```
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
Sentry Logger [log]: Initializing Sentry: process: 32709, thread: main.
Sentry Logger [log]: [instrumentation:express, router] Bun/Deno, subscribing eagerly

{"type":"event","exception":"Sentry API Route Test Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"sdk":"sentry.javascript.tanstackstart-react","runtime":{"name":"node","version":"v26.3.0"},"hasContextLine":true}
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"url","status":"internal_error","spans":[]}
{"type":"transaction","name":"GET /param/42","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /users/123","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /api/user/42","op":"http.server","source":"url","status":"ok","spans":[]}

{"t":"event","exc":"iso-a","tags":{"probe-tag":"a"},"traceId":"ad0c50c6ee7e4e83947f67101ba6112a"}
{"t":"event","exc":"iso-b","tags":{"probe-tag":"b"},"traceId":"921e1a96fb7c481598e2ea4d468d2d0f"}
{"t":"event","exc":"iso-c","tags":{"probe-tag":"c"},"traceId":"d862d4b361f241cc9c4ee65996184aa1"}
{"t":"transaction","name":"GET /api/tag/a","traceId":"ad0c50c6ee7e4e83947f67101ba6112a"}
{"t":"transaction","name":"GET /api/tag/b","traceId":"921e1a96fb7c481598e2ea4d468d2d0f"}
{"t":"transaction","name":"GET /api/tag/c","traceId":"d862d4b361f241cc9c4ee65996184aa1"}

{"t":"transaction","name":"GET /api/error","source":"url","op":"http.server","traceId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"bbbbbbbbbbbbbbbb","spans":[]}
{"t":"event","exc":"Sentry API Route Test Error","traceId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"bbbbbbbbbbbbbbbb"}

{"t":"transaction","name":"GET /api/fetchout","source":"url","op":"http.server","traceId":"fbe865f5472e4fa282c0e97211285910","spans":[]}
RECORDER [{"url":"/rec","sentryTrace":null,"baggage":null}]

DBRESP {"status":"ok","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
{"t":"transaction","name":"GET /api/db-mysql","source":"url","op":"http.server","traceId":"cc09cdf27d6e4abfbeeea82b4105f959","spans":["db SELECT id, name FROM users"]}

{"t":"transaction","name":"GET /api/log","source":"url","op":"http.server","traceId":"fadbc65f073d4db0b080bca0a4621dc4","spans":[]}
{"t":"log","logs":["info: probe-log-from-handler"]}
```

## Observed on 2026-09-07

`npx vite build` succeeded with the workaround plugin in place (`✓ built in 2.43s`). Boot under deno
2.9.0 (`app-rebuild.log`):

```
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
Sentry Logger [log]: Initializing Sentry: process: 29935, thread: main.
Sentry Logger [log]: [instrumentation:express, router] Bun/Deno, subscribing eagerly
```

Sink items (`items-rebuild.json`, trimmed to the fields that carry the verdict):

```
errors:
{"type":"event","exception":"Error: Sentry API Route Test Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"sdk":"sentry.javascript.tanstackstart-react","runtime":"node","hasContextLine":true,"transaction":"GET /api/error","trace_id":"683bf0e76e1d4c51b617dddedc01994d"}
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"url","status":"internal_error","trace_id":"683bf0e76e1d4c51b617dddedc01994d","spans":["middleware globalRequestMiddleware"]}

route names:
{"type":"transaction","name":"GET /api/user/42","op":"http.server","source":"url","status":"ok","spans":["middleware globalRequestMiddleware"]}
{"type":"transaction","name":"GET /param/42","op":"http.server","source":"url","status":"ok","spans":["middleware globalRequestMiddleware"]}
{"type":"transaction","name":"GET /users/123","op":"http.server","source":"url","status":"ok","spans":["middleware globalRequestMiddleware"]}

isolation:
{"type":"event","exception":"Error: iso-a","tags":{"probe-tag":"a"},"transaction":"GET /api/tag/a","trace_id":"634c47de20e04ed4bd16bdbc7aa673d4"}
{"type":"event","exception":"Error: iso-b","tags":{"probe-tag":"b"},"transaction":"GET /api/tag/b","trace_id":"18ca041012ba40c99fe12bfdf138482f"}
{"type":"event","exception":"Error: iso-c","tags":{"probe-tag":"c"},"transaction":"GET /api/tag/c","trace_id":"11b0ce815609485199f4230164a93aa5"}
{"type":"transaction","name":"GET /api/tag/a","trace_id":"634c47de20e04ed4bd16bdbc7aa673d4"}
{"type":"transaction","name":"GET /api/tag/b","trace_id":"18ca041012ba40c99fe12bfdf138482f"}
{"type":"transaction","name":"GET /api/tag/c","trace_id":"11b0ce815609485199f4230164a93aa5"}

incoming trace:
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"url","status":"internal_error","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["middleware globalRequestMiddleware"]}
{"type":"event","exception":"Error: Sentry API Route Test Error","transaction":"GET /api/error","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}

outgoing fetch:
{"type":"transaction","name":"GET /api/fetchout","op":"http.server","source":"url","status":"ok","trace_id":"5915bdab887e4918a261009c38ddba29","spans":["middleware globalRequestMiddleware"]}
RECORDER [{"url":"/rec","sentryTrace":null,"baggage":null}]

db spans:
DBRESP {"status":"ok","rows":[{"id":1,"name":"Ada"},{"id":2,"name":"Linus"}]}
{"type":"transaction","name":"GET /api/db-mysql","op":"http.server","source":"url","status":"ok","trace_id":"693483c187554a138939cf42242c8f8c","spans":["middleware globalRequestMiddleware","db SELECT id, name FROM users"]}

logs:
{"type":"transaction","name":"GET /api/log","op":"http.server","source":"url","status":"ok","trace_id":"6b6b07039a034154b5eb25075b258aec","spans":["middleware globalRequestMiddleware"]}
{"type":"log","items":["info: probe-log-from-handler"]}
```

**Matches the record on all seven capabilities.** errors works, route names broken (raw path, `source:
"url"`, never `GET /users/$userId` / `source: "route"`), isolation works (each event carries only its
own tag and its own transaction's trace id), incoming trace works (trace id `aaaa…` with parent
`bbbbbbbbbbbbbbbb` on both the transaction and the error), outgoing fetch broken (no `http.client` span,
recorder saw `sentryTrace: null` and `baggage: null`), db spans work (`db SELECT id, name FROM users`
nested in the http.server transaction), logs work.

Two cosmetic differences from the recorded lines, neither changing a verdict:

- Every transaction here also carries a `middleware globalRequestMiddleware` child span; the record's
  `spans` arrays are empty. The record's evidence was collected with the sink variant that omitted the
  middleware span, and the transactions were otherwise identical.
- `DBRESP` rows read `Ada` / `Linus` rather than `ada` / `linus`; that is the casing currently in the
  shared MariaDB `users` table.

One fix was made to the harness, not to the app: `run-probes.sh` used a bare `wait` after the three
concurrent isolation curls, which also waited on the sink, recorder and app background jobs and hung
forever. It now waits on the three captured curl pids. The isolation, incoming-trace, fetch, db, log and
sentinel probes above were driven by hand with the same curls while that hang was diagnosed.
