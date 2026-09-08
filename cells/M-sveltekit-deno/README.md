# M-sveltekit-deno — SvelteKit 2 + adapter-node on Deno 2.9.0

## What it reproduces

SvelteKit 2 (`@sveltejs/kit` 2.70.3, `@sveltejs/adapter-node` 5.5.7, svelte 5, vite 6) built with
`vite build` under node and then served by Deno 2.9.0 straight from `build/index.js`, instrumented
with the develop (v11 line, 10.67.0) `@sentry/sveltekit` SDK. The server half of `@sentry/sveltekit`
is the full `@sentry/node` SDK with OpenTelemetry, and it boots cleanly on Deno with no `--import`
flag, no import hook and no `@sentry/deno` involved: `Sentry.init` at the top of `src/hooks.server.js`
plus `sentryHandle()` / `handleErrorWithSentry()` is the whole wiring. Errors, SvelteKit route names
(`GET /users/[id]`, `source: "route"`), per-request isolation across concurrent requests, incoming
trace continuation and logs all work. Two things do not: an outgoing global `fetch()` gets no
`http.client` span and no propagation headers (the known Deno K2 gap; the same call over `node:http`
works), and importing `mysql2` with the SDK loaded does not merely lose db spans, it takes the route
down — `@sentry/server-runtime-injection`'s `Module.registerHooks()` transform throws and then
mysql2's `require('../package.json')` fails with `SyntaxError: Unexpected token ':'`
(denoland/deno#36240 reached through the Node SDK's `Module.registerHooks` path).

## Install

```
npm install --no-audit --no-fund
```

(The `@sentry/*` deps resolve from `../../_toolbox/pack/*.tgz`, all built from `develop` at 10.67.0.
`build/` is checked in, so no `vite build` is needed after the install; rebuild with `npx vite build`
if you change `src/`.)

## Run

```
cd $REPRO/cells/M-sveltekit-deno

# sink (envelopes) + recorder (downstream request headers)
PORT=45311 node sink.mjs > sink.log 2>&1 &
PORT=45312 node recorder.mjs > recorder.log 2>&1 &

# build (only if src/ changed)
npx vite build

# 1) stream lifecycle (the develop default)
SINK_PORT=45311 REC_PORT=45312 LIFECYCLE=stream SDK_DEBUG=1 HOST=127.0.0.1 PORT=45313 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi build/index.js > run-stream.log 2>&1 &

# drive
B=http://127.0.0.1:45313
curl -s -X DELETE http://127.0.0.1:45311/__items
curl -s $B/ping; curl -s $B/users/42; curl -s -o /dev/null $B/boom; curl -s -o /dev/null $B/log
curl -s $B/fetchout; curl -s $B/httpout; curl -s $B/db
curl -s -H 'sentry-trace: aaaabbbbccccddddeeeeffff00001111-1234567890abcdef-1' \
     -H 'baggage: sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' $B/trace
curl -s -o /dev/null "$B/iso?t=aaa" & curl -s -o /dev/null "$B/iso?t=bbb" & curl -s -o /dev/null "$B/iso?t=ccc" & wait
curl -s -o /dev/null $B/sentinel      # sentinel; read the sink once it appears, then +7s for logs
curl -s http://127.0.0.1:45311/__items; cat recorder.log

# 2) static lifecycle (transaction envelopes with nested spans[] and transaction_info.source)
SINK_PORT=45311 REC_PORT=45312 LIFECYCLE=static HOST=127.0.0.1 PORT=45319 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi build/index.js > run-static.log 2>&1 &

# 3) mysql2-without-Sentry control
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi mysqlbase.mjs
```

`--allow-ffi` is only needed for mysql2. MariaDB must be reachable at `127.0.0.1:3307`
(root, no password, db `app`, table `users`).

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works — a throw in a `+server.js` GET handler arrives as an unhandled event, mechanism `auto.function.sveltekit.handle_error`, `handled:false`, sdk `sentry.javascript.sveltekit`, transaction `GET /boom`, context lines, same trace_id as the request. |
| route names | works — `/users/42` is named `GET /users/[id]` (SvelteKit's route id, not the raw URL); static lifecycle carries `"source":"route"`. Stream spans expose no `sentry.source` attribute. |
| isolation | works — three concurrent `/iso?t=aaa\|bbb\|ccc`, each `setTag` then a 120ms await then `captureException`: each event carries exactly its own tag and its own trace id. |
| incoming trace | works — `sentry-trace: aaaabbbbccccddddeeeeffff00001111-1234567890abcdef-1` continues: server span and event both carry that trace_id and `parent_span_id: 1234567890abcdef`, and `getActiveSpan()` in the handler agrees. |
| outgoing fetch | broken — global `fetch()` produces NO `http.client` span (`GET /fetchout` has `"spans":[]`) and the recorder sees `sentryTrace: null, baggage: null`. The same call over `node:http` DOES produce `http.client GET http://127.0.0.1:<rec>/rec-http`. |
| db spans | broken — no db span, and worse: with Sentry loaded, importing mysql2 crashes the route. `Module.registerHooks()` transform throws `TypeError: transform is not a function`, then mysql2's `require('../package.json')` fails with `SyntaxError: Unexpected token ':'`. The same query succeeds on Deno 2.9.0 with Sentry absent. |
| logs | works — `Sentry.logger.info('hello-from-sveltekit-route')` arrives as `{"type":"log","items":["info: hello-from-sveltekit-route"]}`. |
| client errors | not-run — only the server side was probed. |

Recorded evidence lines:

```
--- baseline, no Sentry (SvelteKit adapter-node on Deno) ---
Listening on http://0.0.0.0:41337
pong
user 42

--- SDK boot under Deno ---
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
Sentry Logger [log]: Integration installed: Http
Sentry Logger [log]: Integration installed: SvelteKitSpansEnhancement
Sentry Logger [log]: Integration installed: SpanStreaming
Sentry Logger [log]: SDK initialized from ESM
Sentry Logger [log]: [Sentry] Runtime hook registered, injected libraries=[]

--- errors + route names + logs, traceLifecycle: 'stream' ---
{"type":"event","exception":"boom-in-route-handler","mechanism":"auto.function.sveltekit.handle_error","handled":false,"sdk":"sentry.javascript.sveltekit","trace_id":"bdcd2e2fc490408a9ee05b534db157e5","transaction":"GET /boom","hasContextLine":true}
{"type":"span","items":["http.server GET /users/[id] [src=- trace=efc6e6d4bde146f28d0846c7ed464f54 parent=-]"]}
{"type":"log","items":["info: hello-from-sveltekit-route"]}

--- route names + source, traceLifecycle: 'static' ---
{"type":"transaction","name":"GET /users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"4e99c4c48e594ed28d2f11d0ebb6c6a5","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"f4fc5000f7684e31890d45a790de047e","spans":[]}

--- isolation, three concurrent requests ---
{"type":"event","exception":"iso-error-aaa","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"iso_tag":"aaa"},"trace_id":"0d419fe9c06847cabc2f04c44e7038f6","transaction":"GET /iso"}
{"type":"event","exception":"iso-error-bbb","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"iso_tag":"bbb"},"trace_id":"36112d7964554f88b06e1d7025265354","transaction":"GET /iso"}
{"type":"event","exception":"iso-error-ccc","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"iso_tag":"ccc"},"trace_id":"e620d12a9b7f43bba881b8141c8a6d2e","transaction":"GET /iso"}

--- incoming trace ---
handler saw: {"trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1234567890abcdef","span_id":"8d57b1afac2da5ef"}
{"type":"event","message":"trace-probe","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1234567890abcdef","transaction":"GET /trace"}
{"type":"span","items":["http.server GET /trace [src=- trace=aaaabbbbccccddddeeeeffff00001111 parent=1234567890abcdef]"]}

--- outgoing fetch (broken) vs node:http (works), static lifecycle ---
{"type":"transaction","name":"GET /httpout","op":"http.server","source":"route","status":"ok","trace_id":"0b4cd43999414b01a616c0ca5e25be16","spans":["http.client GET http://127.0.0.1:52432/rec-http"]}
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"e9dcf039aefc424fbace909310442c07","spans":[]}
```

## Observed on 2026-09-07

Rebuilt from scratch in this directory (kit 2.70.3, adapter-node 5.5.7, svelte 5.57.0, vite 6.4.3,
mysql2 3.24.3, deno 2.9.0 aarch64-apple-darwin), SDK from the develop tarballs at 10.67.0. Sink on
45311, recorder on 45312, app on 45313 (stream) / 45319 (static). All seven probed capabilities
reproduced the recorded verdict.

```
### SDK boot under Deno (run-stream.log)
Sentry Logger [log]: Registered diagnostics-channel injection via Module.registerHooks()
Sentry Logger [log]: Integration installed: Http
Sentry Logger [log]: Integration installed: SvelteKitSpansEnhancement
Sentry Logger [log]: Integration installed: SpanStreaming
Sentry Logger [log]: SDK initialized from ESM
Sentry Logger [log]: [Sentry] Runtime hook registered, injected libraries=[]

### routes answer under Deno
$ curl http://127.0.0.1:45313/ping      -> pong
$ curl http://127.0.0.1:45313/users/42  -> user 42
$ curl http://127.0.0.1:45313/boom      -> 500
$ curl http://127.0.0.1:45313/db        -> {"message":"Internal Error"} [500]

### errors, stream lifecycle (items-stream.json)
{"type":"event","exception":"Error: boom-in-route-handler","mechanism":"auto.function.sveltekit.handle_error","handled":false,"sdk":"sentry.javascript.sveltekit","runtime":"node","hasContextLine":true,"transaction":"GET /boom","trace_id":"ca2a732ffaa34dff954694c50d6e41d5","environment":"probe"}
{"type":"span","trace_id":"ca2a732ffaa34dff954694c50d6e41d5","items":[{"n":"http.server GET /boom","trace_id":"ca2a732ffaa34dff954694c50d6e41d5","http_route":"/boom","origin":"auto.http.sveltekit"}]}

### route names, stream lifecycle — no sentry.source on the span item
{"type":"span","trace_id":"e192e7f4fa43439293ff11504cc6dcba","items":[{"n":"http.server GET /users/[id]","trace_id":"e192e7f4fa43439293ff11504cc6dcba","http_route":"/users/[id]","origin":"auto.http.sveltekit"}]}

### route names + source, static lifecycle (items-static.json)
{"type":"transaction","name":"GET /users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"aa418c56098143f6b1dd6c16edf1d2c9","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"afa6581c6e6546aa80f65fc6ecb50c50","spans":[]}

### isolation, three concurrent /iso?t=
{"type":"event","exception":"Error: iso-error-aaa","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"iso_tag":"aaa"},"trace_id":"8c457839454842578a48591bf903d0b7","transaction":"GET /iso"}
{"type":"event","exception":"Error: iso-error-bbb","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"iso_tag":"bbb"},"trace_id":"35b942fbb3404728b0867bb05f6b980e","transaction":"GET /iso"}
{"type":"event","exception":"Error: iso-error-ccc","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"iso_tag":"ccc"},"trace_id":"90d367f3878c435a853fdecf00333a4e","transaction":"GET /iso"}

### incoming trace continuation
handler saw: {"trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1234567890abcdef","span_id":"bad4306092279fa7"}
{"type":"event","message":"trace-probe","transaction":"GET /trace","trace_id":"aaaabbbbccccddddeeeeffff00001111"}
{"type":"span","trace_id":"aaaabbbbccccddddeeeeffff00001111","items":[{"n":"http.server GET /trace","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent":"1234567890abcdef","http_route":"/trace","origin":"auto.http.sveltekit"}]}

### outgoing fetch — broken; node:http — works
# stream: /fetchout produces only the server span, /httpout carries an http.client child
{"type":"span","trace_id":"fac430ab2e154a1c8ef1a08e94ea18fb","items":[{"n":"http.server GET /fetchout","trace_id":"fac430ab2e154a1c8ef1a08e94ea18fb","http_route":"/fetchout","origin":"auto.http.sveltekit"}]}
{"type":"span","trace_id":"58ea664386514939b8913370a81c8c7e","items":[{"n":"http.client GET 127.0.0.1","trace_id":"58ea664386514939b8913370a81c8c7e","parent":"9c71b8922a399306","origin":"auto.http.client"},{"n":"http.server GET /httpout","trace_id":"58ea664386514939b8913370a81c8c7e","http_route":"/httpout","origin":"auto.http.sveltekit"}]}
# static
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"697eb8f46ac947f2be64de63d2554dd9","spans":[]}
{"type":"transaction","name":"GET /httpout","op":"http.server","source":"route","status":"ok","trace_id":"258eab9892ea4a3d96d1755d7d7ffd31","spans":["http.client GET http://127.0.0.1:45312/rec-http"]}
# recorder.log
{"path":"/rec-fetch","sentryTrace":null,"baggage":null,"traceparent":null}
{"path":"/rec-http","sentryTrace":"58ea664386514939b8913370a81c8c7e-a88f7c160d46b1b2-1","baggage":"sentry-environment=probe,sentry-public_key=public,sentry-trace_id=58ea664386514939b8913370a81c8c7e,sentry-transaction=GET%20%2Fhttpout,sentry-sampled=true,sentry-sample_rand=0.5042403509439877,sentry-sample_rate=1"}

### db spans — the route is taken down, not just unspanned (run-stream.log)
[Sentry] `@sentry/server-runtime-injection` was bundled into your application, so mysql2 and any other instrumented dependency load uninstrumented. Keep `@sentry/server-runtime-injection` external in your server bundle, or use the Sentry bundler plugin for build-time instrumentation.
Sentry Logger [warn]: [instrumentation] failed to inject diagnostics-channel into mysql2: TypeError: transform is not a function
    at Transformer.visit_fn (.../node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/code-transformer/lib/transformer.js:195:5)
    at loadSync (.../node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/tracing-hooks/hook.js:127:10)
SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Object.<anonymous> (.../node_modules/mysql2/lib/connection_config.js:13:21)
{"type":"event","exception":"SyntaxError: Unexpected token ':'","mechanism":"auto.function.sveltekit.handle_error","handled":false,"sdk":"sentry.javascript.sveltekit","transaction":"GET /db","trace_id":"05f5cb14b95846dfad94260a9f4fc84d"}
# control: same driver, same query, same Deno, no Sentry in the process
$ deno run ... mysqlbase.mjs
mysqlbase rows: 2

### logs
{"type":"log","items":["info: hello-from-sveltekit-route"]}
```

Match: yes, for all seven probed capabilities (errors, route names, isolation, incoming trace,
outgoing fetch broken, db spans broken, logs). Client errors stay `not-run`, as recorded.

Only difference worth writing down: the `` `@sentry/server-runtime-injection` was bundled into your
application `` warning fires here even though `vite.config.js` keeps `@sentry/*` external and the
emitted `.svelte-kit/output/server/entries/hooks.server.js` really does `import * as Sentry from
"@sentry/sveltekit"`. The record attributes that warning to a build *without* the externals, so under
Deno it appears to be a false positive. It changes no verdict: the mysql2 failure that follows it is
the recorded `Module.registerHooks` transform crash, not a "loaded uninstrumented" degradation.

## Files

- `src/hooks.server.js` — `Sentry.init` + `sentryHandle()` + `handleErrorWithSentry()`; `LIFECYCLE` env picks stream/static
- `src/routes/**/+server.js` — `ping`, `users/[id]`, `boom`, `log`, `fetchout`, `httpout`, `db`, `trace`, `iso`, `sentinel`
- `src/lib/db.js` — module-scope `mysql2/promise` connection, imported by the `/db` route
- `vite.config.js` — `sentrySvelteKit()` from `@sentry/sveltekit/vite` (not the root entry) plus the mysql2/`@sentry/*` externals
- `mysqlbase.mjs` — mysql2 on Deno with no Sentry in the process (the db control)
- `sink.mjs` — envelope sink keeping span `parent_span_id`, `http.route`, `origin` and `sentry.source`
- `recorder.mjs` — downstream endpoint logging `sentry-trace` / `baggage`
- `items-stream.json`, `items-static.json` — the sink dumps quoted above
- `run-stream.log`, `run-static.log`, `mysqlbase.log`, `recorder.log`, `build.log`, `install.log` — raw run output
