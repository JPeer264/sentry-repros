# M-reactrouter-deno

React Router 7.18.3 (framework mode, SSR) + `@sentry/react-router` 10.67.0 (develop / v11 line)
running on Deno 2.9.0.

## What it reproduces

React Router framework mode does run on Deno, and `@sentry/react-router` (the `@sentry/node`-based
server SDK, resolved through the `node` export condition) initializes there with every Node
integration installed, but not with the wiring the docs prescribe. `react-dom/server` resolves
through react-dom's `deno` export condition to the browser build, which has no
`renderToPipeableStream`, so `app/entry.server.tsx` has to be rewritten around
`renderToReadableStream`; that also rules out `react-router-serve`, and Deno ignores the
`NODE_OPTIONS='--import ./instrument.server.mjs'` the docs use to load the instrumentation, so the
server is a hand-written `node:http` adapter whose first line imports the instrumentation file. With
that wiring, errors, parameterized route names, request isolation, incoming trace continuation and
logs all work. Outgoing global `fetch` gets neither an `http.client` span nor `sentry-trace`/`baggage`
headers (Deno K2: Deno's fetch does not emit the undici diagnostics channels), while `node:http` from
the same loader is fully instrumented. Database spans are partial: `mysql2` cannot be imported at all
once Sentry is initialized (`require('../package.json')` in `connection_config.js:13` throws
`SyntaxError: Unexpected token ':'` through the runtime require hook), and with `mysql@2` a
module-scope pool emits its query span as a standalone `db` transaction on the module-load trace
instead of as a child of the request, while a connection created inside the loader nests correctly.

## Install

```
cd $REPRO/cells/M-reactrouter-deno && \
npm install --no-audit --no-fund react-router@7.18.3 @react-router/dev@7.18.3 @react-router/node@7.18.3 react@^19 react-dom@^19 vite@^6 isbot@^5 mysql@^2 mysql2@^3 && \
npm install --no-audit --no-fund ../../_toolbox/pack/sentry-react-router-10.67.0.tgz ../../_toolbox/pack/sentry-node-10.67.0.tgz ../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz ../../_toolbox/pack/sentry-browser-10.67.0.tgz ../../_toolbox/pack/sentry-react-10.67.0.tgz ../../_toolbox/pack/sentry-browser-utils-10.67.0.tgz ../../_toolbox/pack/sentry-replay-10.67.0.tgz ../../_toolbox/pack/sentry-replay-canvas-10.67.0.tgz ../../_toolbox/pack/sentry-feedback-10.67.0.tgz ../../_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz
```

All `@sentry/*` tarballs must be on one command line so npm resolves their `10.67.0` transitive pins.
`build/` is committed, so a rerun that only wants to run the app can skip `npx react-router build`.

Needs MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`) for the `/db`
probe.

## Run

```
cd $REPRO/cells/M-reactrouter-deno

# sink + outgoing-request recorder
PORT=41522 node sink.mjs > sink.log 2>&1 &
PORT=41523 node recorder.mjs > rec.log 2>&1 &

# build (only needed after a source change) and run
npx react-router build
PORT=41521 SINK_PORT=41522 TRACE_LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs > app-static.log 2>&1 &

# probes
curl -s -X DELETE http://127.0.0.1:41522/__items
curl -s -o /dev/null http://127.0.0.1:41521/users/42
curl -s -o /dev/null http://127.0.0.1:41521/boom
for t in alpha bravo charlie; do curl -s -o /dev/null http://127.0.0.1:41521/iso/$t & done; wait
TID=aaaabbbbccccddddeeeeffff00001111
curl -s -o /dev/null -H "sentry-trace: $TID-1234567890abcdef-1" \
  -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=abcdef1234567890abcdef1234567890,sentry-sample_rate=1,sentry-sampled=true" \
  http://127.0.0.1:41521/users/7
curl -s -o /dev/null "http://127.0.0.1:41521/fetchout?target=http%3A%2F%2F127.0.0.1%3A41523%2Frec-fetch"
curl -s -o /dev/null "http://127.0.0.1:41521/httpout?target=http%3A%2F%2F127.0.0.1%3A41523%2Frec-http"
curl -s -o /dev/null http://127.0.0.1:41521/db            # module-scope mysql pool
curl -s -o /dev/null "http://127.0.0.1:41521/db?fresh=1"  # connection created in the loader
curl -s -o /dev/null http://127.0.0.1:41521/logs
curl -s -o /dev/null http://127.0.0.1:41521/sentinel      # captureMessage + flush
sleep 8
curl -s http://127.0.0.1:41522/__items | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const i of JSON.parse(d))console.log(JSON.stringify(i))})"
curl -s http://127.0.0.1:41523/__seen

# mysql2 under Sentry (crashes) vs plain (works)
SINK_PORT=41522 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys t2.mjs
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys t.mjs

# viability without Sentry, and react-dom/server exports under Deno
PORT=41521 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server-plain.mjs
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-reactdom.mjs

# stream lifecycle variant
PORT=41521 SINK_PORT=41522 TRACE_LIFECYCLE=stream deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs
```

## Expected (recorded verdict)

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | broken |
| db spans | partial |
| logs | works |
| client errors | not-run (server-only cell) |

Recorded evidence lines:

```
# viability, docs-shaped entry.server.tsx (renderToPipeableStream) under deno:
error: Uncaught SyntaxError: The requested module 'react-dom/server' does not provide an export named 'renderToPipeableStream'

# errors + route names (traceLifecycle: 'static')
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"9cf198adeb59442699932bb79af40f08","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"9bcd56b863414ed79c85afcdfbb5eeee","spans":[]}
{"type":"event","exception":"rr-deno loader boom","mechanism":"react-router","handled":false,"sdk":"sentry.javascript.react-router","trace_id":"9bcd56b863414ed79c85afcdfbb5eeee","transaction":"GET /boom","url":"http://127.0.0.1:52101/boom","hasContextLine":true}

# isolation, 3 concurrent GET /iso/<tag>
{"type":"transaction","name":"GET /iso/:tag","source":"route","trace_id":"63e9d18249cf4f23ae3622b785223a03","tags":{"runtime":"node","iso_tag":"alpha"}}
{"type":"transaction","name":"GET /iso/:tag","source":"route","trace_id":"58afecd703cb45cea3c60a1227e163b9","tags":{"runtime":"node","iso_tag":"bravo"}}
{"type":"transaction","name":"GET /iso/:tag","source":"route","trace_id":"23e480f893c54e6395494a5700aff45b","tags":{"runtime":"node","iso_tag":"charlie"}}
{"type":"event","exception":"iso-error-alpha","handled":true,"tags":{"runtime":"node","iso_tag":"alpha"},"trace_id":"63e9d18249cf4f23ae3622b785223a03"}
{"type":"event","exception":"iso-error-bravo","handled":true,"tags":{"runtime":"node","iso_tag":"bravo"},"trace_id":"58afecd703cb45cea3c60a1227e163b9"}
{"type":"event","exception":"iso-error-charlie","handled":true,"tags":{"runtime":"node","iso_tag":"charlie"},"trace_id":"23e480f893c54e6395494a5700aff45b"}

# incoming trace + logs
{"type":"transaction","name":"GET /users/:id","source":"route","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1234567890abcdef"}
{"type":"log","items":["info: rr-deno log from loader trace=22ee900c952341e0832d0d2da4fb1739"]}

# outgoing fetch vs node:http (same app, same lifecycle)
{"type":"transaction","name":"GET /httpout","source":"route","trace_id":"7c863df7238d43ddb75677ffac5485a7","spans":["http.client GET http://127.0.0.1:52103/rec-http"]}
{"type":"transaction","name":"GET /fetchout","source":"route","trace_id":"10dacc1063334144ab1bb9f34888b81e","spans":[]}
recorder: [{"url":"/rec-http","sentryTrace":"7c863df7238d43ddb75677ffac5485a7-a9a700032e7a61bb-1","baggage":"sentry-environment=production,...,sentry-trace_id=7c863df7238d43ddb75677ffac5485a7,..."},
           {"url":"/rec-fetch","sentryTrace":null,"baggage":null}]

# stream lifecycle (traceLifecycle default)
{"type":"span","items":["http.server | GET /users/:id | trace=48bffd1defba4ab69bafcad0fa7680b6 | parent=-"]}
```

Recorded db-spans detail: no extra instrumentation path is needed, the SDK logs
`[instrumentation:mysql] Bun/Deno, subscribing eagerly` and the channel fires, but `mysql2` cannot be
loaded once Sentry is initialized: `require('../package.json')` at `connection_config.js:13` throws
`SyntaxError: Unexpected token ':'`.

## Observed on 2026-09-07

Rebuilt and run once on deno 2.9.0, node v26.5.0 (build + sink), React Router 7.18.3,
`@sentry/*` 10.67.0 tarballs, ports 41521 (app) / 41522 (sink) / 41523 (recorder). Every capability
matches the recorded verdict.

```
# viability: react-dom/server under Deno has no renderToPipeableStream
$ deno run ... probe-reactdom.mjs
["default","module.exports","renderToReadableStream","renderToStaticMarkup","renderToString","resume","version"]
renderToPipeableStream: undefined

# viability without Sentry (server-plain.mjs)
READY-PLAIN http://127.0.0.1:41521
...\"hasActiveSpan\",false,\"rootSpanName\",\"traceId\"]  (200, SSR HTML)

# init
[probe] sentry initialized: true lifecycle: static
READY http://127.0.0.1:41521

# errors -- works
{"type":"event","exception":"Error: rr-deno loader boom","mechanism":"react-router","handled":false,"sdk":"sentry.javascript.react-router","runtime":"node","hasContextLine":true,"transaction":"GET /boom","trace_id":"249c9d5ead6641458660e463751f2aea","tags":{"runtime":"node"},"request":{"url":"http://127.0.0.1:41521/boom","method":"GET"},"environment":"production"}

# route names -- works
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"32cc1055bab94b8ca2da541352218fb4","sdk":"sentry.javascript.react-router","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"249c9d5ead6641458660e463751f2aea","sdk":"sentry.javascript.react-router","spans":[]}
$ curl -s http://127.0.0.1:41521/users/42
hasActiveSpan":true,"traceId":"32cc1055bab94b8ca2da541352218fb4"

# isolation -- works, 3 concurrent GET /iso/<tag>, no bleed
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"e0ba59741acf428da7a842653fb4804d"}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"7f465e5fef7043e4bf4dbaa0620c1b5f"}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"d2c2d51c70544ab2a60353e70cfad86b"}
{"type":"event","exception":"Error: iso-error-alpha","handled":true,"transaction":"GET /iso/alpha","trace_id":"e0ba59741acf428da7a842653fb4804d","tags":{"runtime":"node","iso_tag":"alpha"}}
{"type":"event","exception":"Error: iso-error-bravo","handled":true,"transaction":"GET /iso/bravo","trace_id":"7f465e5fef7043e4bf4dbaa0620c1b5f","tags":{"runtime":"node","iso_tag":"bravo"}}
{"type":"event","exception":"Error: iso-error-charlie","handled":true,"transaction":"GET /iso/charlie","trace_id":"d2c2d51c70544ab2a60353e70cfad86b","tags":{"runtime":"node","iso_tag":"charlie"}}

# incoming trace -- works
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1234567890abcdef","sdk":"sentry.javascript.react-router","spans":[]}

# outgoing fetch -- broken; node:http from the same loader works
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"98659812d4284e4989c88b8ee2731cf7","spans":[]}
{"type":"transaction","name":"GET /httpout","op":"http.server","source":"route","status":"ok","trace_id":"38ebdfccb992492eaad902429b488720","spans":["http.client GET http://127.0.0.1:41523/rec-http"]}
recorder: {"url":"/rec-fetch","sentryTrace":null,"baggage":null}
recorder: {"url":"/rec-http","sentryTrace":"38ebdfccb992492eaad902429b488720-b38523826b6bc304-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=38ebdfccb992492eaad902429b488720,sentry-sampled=true,sentry-sample_rand=0.6239457606657662,sentry-sample_rate=1"}

# db spans -- partial
# (a) mysql2 is unloadable once Sentry is initialized, plain Deno imports it fine
$ SINK_PORT=41522 deno run ... t2.mjs
SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at Object.<anonymous> (.../node_modules/mysql2/lib/connection_config.js:13:21)
$ deno run ... t.mjs
mysql2 rows (no sentry) [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
# (b) mysql@2 queries are recorded, but a module-scope pool puts the span on the module-load trace
#     as its own transaction instead of inside the request; a loader-scope connection nests correctly
{"t":"transaction","name":"SELECT id, name FROM users","op":"db","trace":"c8d23036486d4565954cdd742e9ddd3e","spans":[]}
{"t":"transaction","name":"GET /db","op":"http.server","trace":"d72cb80eb1c1424ba49d51ce1e3371b5","spans":[]}
{"t":"transaction","name":"SELECT id, name FROM users","op":"db","trace":"c8d23036486d4565954cdd742e9ddd3e","spans":[]}
{"t":"transaction","name":"GET /db","op":"http.server","trace":"937ccd027b2b4959b24538ba9b1efd04","spans":[]}
{"t":"transaction","name":"GET /db","op":"http.server","trace":"1b671c4fb39b4ac9a69376d1c141931b","spans":["db SELECT id, name FROM users"]}

# logs -- works
{"type":"log","items":["info: rr-deno log from loader trace=d72bd7dc969d4562a4a1616771b3e807"]}
{"type":"transaction","name":"GET /logs","op":"http.server","source":"route","status":"ok","trace_id":"d72bd7dc969d4562a4a1616771b3e807"}

# stream lifecycle -- same parameterized names as span envelopes
{"type":"span","items":["http.server GET /users/:id"],"trace":"7ce6c598908542d798dbc0ef79d474a6","parent":["-"]}
{"type":"span","items":["http.server GET /boom"],"trace":"eac27db4a474422cbf8e435b7b1d662e","parent":["-"]}
{"type":"span","items":["http.server GET /sentinel"],"trace":"b2615966315943e78c0f254bc8e254f9","parent":["-"]}
```

The record's noted inconsistency also reproduces: the error event's own `transaction` field carries
the raw path (`GET /iso/alpha`) while the transaction and span carry `GET /iso/:tag`.

Differences from the record, none of them changing a verdict:

- The record's db-spans detail names only the `mysql2` crash; the second half of that entry is
  truncated in `cells.json`. The rebuild shows the module-scope `mysql@2` pool emitting its span on
  the module-load trace as a standalone `db` transaction, which is the other half of the `partial`.
- The `t2.mjs` run also prints a `@sentry/server-runtime-injection was bundled into your application`
  warning before the crash, because the probe script imports the instrumentation file directly.
- `@sentry/bundler-plugins-10.67.0.tgz` is now in `_toolbox/pack`, so no extra `npm pack` step is
  needed for `@sentry/react-router`.
- Ports, trace ids and span ids differ per run, as expected.
- `client errors` was not exercised here either: no browser was driven.

## Layout

- `sink.mjs` — toolbox sink extended with trace ids, parent span id, tags, request data and `spans[]`
  (copied from the `M-remix-deno` cell); `/__items`, `/__items?raw`.
- `recorder.mjs` — echoes `sentry-trace` / `baggage` of anything it receives, dumped at `/__seen`.
- `instrument.server.mjs` — `Sentry.init` from `@sentry/react-router`, `tunnel` at the sink,
  `tracesSampleRate: 1.0`, lifecycle from `TRACE_LIFECYCLE`.
- `server.mjs` — hand-written `node:http` adapter, first line `import './instrument.server.mjs';`,
  then `createRequestHandler(build, 'production')`.
- `server-plain.mjs` — the same adapter without Sentry, for the viability check.
- `app/entry.server.tsx` — `renderToReadableStream` rewrite wrapped in `wrapSentryHandleRequest`,
  plus `handleError = createSentryHandleError({ logErrors: true })`.
- `app/routes/` — `users.$id` (active span report), `boom` (loader throw), `iso.$tag` (setTag + await
  + captureException), `fetchout`, `httpout`, `db`, `logs`, `sentinel`.
  `app/routes/users..tsx` is a leftover from a shell expansion and is not referenced.
- `app/db.server.ts` — module-scope `mysql@2` pool plus a loader-scope connection helper.
- `t2.mjs` / `t.mjs` — mysql2 with and without Sentry.
- `probe-reactdom.mjs` — prints the `react-dom/server` exports Deno resolves.
- `build/` — the SSR/client build (380 KB) from this run; `npx react-router build` regenerates it.
