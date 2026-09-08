# M-reactrouter-bun

React Router 8 (framework mode, custom Express server) + `@sentry/react-router` 10.67.0
(develop / v11 line) running on Bun.

## What it reproduces

A React Router 8 app built from the official `node-custom-server` template, instrumented with the
develop build of `@sentry/react-router`, and served with `bun server.js`. Two things break. First,
the stock template cannot run on Bun at all: Bun resolves `react-dom/server` to `server.bun.js`,
which exports no `renderToPipeableStream`, so `app/entry.server.tsx` has to be rewritten around
`renderToReadableStream` — which in turn makes `Sentry.createSentryHandleRequest` (the wiring the
docs and the `react-router-8-framework` e2e app show, it takes `renderToPipeableStream` as a required
option) unusable, leaving only `Sentry.wrapSentryHandleRequest`. Second, once it boots, the SDK
records errors and logs but nothing else: on the v11 line `@sentry/node` takes all of its
instrumentation from diagnostics channels registered by `@sentry/server-runtime-injection`, and the
registration API does not exist on Bun, so there is no request span, no request isolation (all
concurrent requests share one scope and one process-lifetime trace id), no incoming trace
continuation, no outgoing `fetch` headers or span, and no db span.

## Install

```
cd app && npm install --no-audit --no-fund && npm install --no-audit --no-fund \
  ../../../_toolbox/pack/sentry-react-router-10.67.0.tgz ../../../_toolbox/pack/sentry-node-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-core-10.67.0.tgz ../../../_toolbox/pack/sentry-browser-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-react-10.67.0.tgz ../../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz mysql2
```

(All `@sentry/*` tarballs must be on one command line so npm resolves their `10.67.0` transitive
pins. `@sentry/bundler-plugins` is a runtime dependency of `@sentry/react-router`; without it npm
cannot install `@sentry/react-router` at all.)

Needs MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`) for the
`mode=db` probe.

## Run

```
# sink (envelope receiver + header-echo recorder at /rec)
PORT=52817 node sink2.mjs > sink.log 2>&1 &

# build with node, run with bun
cd app
npx react-router build
SINK_PORT=52817 SENTRY_DEBUG=1 PORT=52818 bun server.js > ../app-debug.log 2>&1 &

# probes
curl -s "http://127.0.0.1:52818/users/42"                                   # route names / active span
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:52818/users/1?mode=error"
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
     -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe" \
     -o /dev/null "http://127.0.0.1:52818/users/1?mode=error"
curl -s "http://127.0.0.1:52818/users/8?mode=fetch&target=http%3A%2F%2F127.0.0.1%3A52817%2Frec"
curl -s "http://127.0.0.1:52818/users/9?mode=db"
curl -s "http://127.0.0.1:52818/users/9?mode=log"
(curl -s -o /dev/null "http://127.0.0.1:52818/users/1?mode=isolation&tag=alpha&delay=300" & \
 curl -s -o /dev/null "http://127.0.0.1:52818/users/2?mode=isolation&tag=bravo&delay=150" & \
 curl -s -o /dev/null "http://127.0.0.1:52818/users/3?mode=isolation&tag=charlie&delay=50" & wait)
curl -s "http://127.0.0.1:52818/flush"        # sentinel + Sentry.flush(2000)

curl -s http://127.0.0.1:52817/__items
curl -s http://127.0.0.1:52817/__raw
```

`/users/:id` is a document route, so the JSON payloads above are inside a `<pre>` in the HTML; the
probe output below was extracted from that element.

## Expected (recorded verdict)

| capability | verdict |
| --- | --- |
| errors | works |
| route names | broken |
| isolation | broken |
| incoming trace | broken |
| outgoing fetch | broken |
| db spans | broken |
| logs | works |
| client errors | not-run (server-only cell) |

Recorded evidence lines:

```
SyntaxError: Export named 'renderToPipeableStream' not found in module '.../node_modules/react-dom/server.bun.js'.
["default","renderToReadableStream","renderToStaticMarkup","renderToString","resume","version"]

Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. ...

{"type":"event","exception":"loader boom on bun","mechanism":"react-router","handled":false,"sdk":"sentry.javascript.react-router","tags":{"runtime":"node"},"trace_id":"75b8f65c357d4cafa81856d25173c558","hasContextLine":true}

$ curl -s http://127.0.0.1:52818/users/42
{"ok":true,"id":"42","hasActiveSpan":false,"rootSpanName":null,"traceId":null}
(raw event) {"transaction":undefined,"trace":{"trace_id":"428283e35934487b92fff4b874cce656","span_id":"8394825f27a14607"}}

{"type":"event","exception":"isolation error charlie","tags":{"probe_tag":"charlie"},"trace_id":"75b8f65c357d4cafa81856d25173c558"}
{"type":"event","exception":"isolation error bravo","tags":{"probe_tag":"charlie"},"trace_id":"75b8f65c357d4cafa81856d25173c558"}
{"type":"event","exception":"isolation error alpha","tags":{"probe_tag":"charlie"},"trace_id":"75b8f65c357d4cafa81856d25173c558"}
{"type":"event","message":"sentinel","tags":{"probe_tag":"charlie"},"trace_id":"75b8f65c357d4cafa81856d25173c558"}

{"ex":"loader boom on bun","trace":{"trace_id":"428283e35934487b92fff4b874cce656","span_id":"863131cc01bb921a"}}

{"ok":"fetch","status":200,"echo":{"rec":true,"headers":{"connection":"keep-alive","user-agent":"Bun/1.4.0","accept":"*/*","host":"127.0.0.1:52817","accept-encoding":"gzip, deflate, br, zstd"}}}

info: probe log from loader
```

## Observed on 2026-09-07

Rebuilt and run once with bun 1.4.2 (the machine's bun; the record used 1.4.0), node v26.5.0,
`@sentry/*` 10.67.0 tarballs. Every capability matches the recorded verdict.

```
# stock template on bun, before the entry.server rewrite
GET / 500 427 - 14.847 ms
SyntaxError: Export named 'renderToPipeableStream' not found in module '$REPRO/cells/M-reactrouter-bun/app/node_modules/react-dom/server.bun.js'.
$ bun -e "import * as m from 'react-dom/server'; console.log(JSON.stringify(Object.keys(m)))"
["default","renderToReadableStream","renderToStaticMarkup","renderToString","resume","version"]

# after the renderToReadableStream rewrite, no Sentry
Starting production server
Server is running on http://localhost:41337
status=200

# Sentry init on bun, SENTRY_DEBUG=1
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
Sentry Logger [log]: SDK successfully initialized

# errors -- works
{"type": "event", "exception": "Error: loader boom on bun", "mechanism": "react-router", "handled": false, "sdk": "sentry.javascript.react-router", "runtime": "node", "hasContextLine": true, "trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974", "tags": {"runtime": "node"}}

# route names -- broken: no active span in the loader, no transaction on the event, zero transaction/span envelopes
$ curl -s http://127.0.0.1:52818/users/42
{"ok":true,"id":"42","hasActiveSpan":false,"rootSpanName":null,"traceId":null}
(raw event) {"type": "event", "transaction": null, "trace": {"trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974", "span_id": "a96fc9b7d57b803e"}, "ex": "loader boom on bun", "spans": []}

# isolation -- broken: three concurrent requests, all events carry charlie's tag and one shared trace id
{"type": "event", "exception": "Error: isolation error charlie", "tags": {"runtime": "node", "probe_tag": "charlie"}, "trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974"}
{"type": "event", "exception": "Error: isolation error bravo", "tags": {"runtime": "node", "probe_tag": "charlie"}, "trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974"}
{"type": "event", "exception": "Error: isolation error alpha", "tags": {"runtime": "node", "probe_tag": "charlie"}, "trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974"}
{"type": "event", "message": "sentinel", "tags": {"runtime": "node", "probe_tag": "charlie"}, "trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974"}

# incoming trace -- broken: sent aaaa...-bbbbbbbbbbbbbbbb-1, event kept the process id, no parent_span_id
{"type": "event", "transaction": null, "trace": {"trace_id": "cd9c31f0b7924871b4fd5b2a5bb5f974", "span_id": "9a808e7935ad1908"}, "ex": "loader boom on bun"}

# outgoing fetch -- broken: recorder saw no sentry-trace / baggage, no http.client span envelope
{"ok":"fetch","status":200,"echo":{"rec":true,"headers":{"connection":"keep-alive","user-agent":"Bun/1.4.2","accept":"*/*","host":"127.0.0.1:52817","accept-encoding":"gzip, deflate, br, zstd"}}}

# db spans -- broken: rows come back, no span envelope, although the channel names are in the SSR bundle
{"ok":"db","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
$ grep -o "orchestrion:mysql2:[a-z]*" app/build/server/assets/*.js | sort -u
app/build/server/assets/context-DmSmaaws.js:orchestrion:mysql2:execute
app/build/server/assets/context-DmSmaaws.js:orchestrion:mysql2:query

# logs -- works
{"type": "log", "items": ["info: probe log from loader"]}
```

Differences from the record, none of them changing a verdict:

- Bun 1.4.2 instead of 1.4.0 (the user-agent the recorder echoed reads `Bun/1.4.2`); the cross-check
  on the CI-pinned bun 1.3.14 was not repeated.
- `@sentry/bundler-plugins-10.67.0.tgz` is now present in `_toolbox/pack`, so the extra `npm pack`
  step the record describes is no longer needed.
- The template scaffolded today puts the Express app in `server/app.ts` and mounts it from
  `server.js`; `Sentry.setupExpressErrorHandler` is applied to the outer app in `server.js`.
- The isolation and sentinel events carry `mechanism: "generic", handled: true` (they come from
  `captureException`/`captureMessage`); the record's trimmed lines did not show the mechanism.
- Trace and span ids differ per run, as expected.

## Layout

- `sink2.mjs` — the toolbox sink plus a `/rec` endpoint that echoes request headers and a `/__raw`
  dump with `transaction`, `tags`, `contexts.trace` and `spans[]`.
- `app/instrument.server.mjs` — `Sentry.init` (`traceLifecycle: 'static'`, `tracesSampleRate: 1.0`,
  `tunnel` at the sink).
- `app/server.js` — template server with `import "./instrument.server.mjs";` as the first line and
  `Sentry.setupExpressErrorHandler(app)` before `listen`.
- `app/app/entry.server.tsx` — `renderToReadableStream` rewrite wrapped in
  `Sentry.wrapSentryHandleRequest`, plus `handleError = Sentry.createSentryHandleError({ logErrors: true })`.
- `app/app/routes/users.tsx` — the probe route (`mode=error|isolation|fetch|db|log`, default reports
  the active span).
- `app/app/routes/flush.tsx` — sentinel + `Sentry.flush`.
- `app/app/db.server.ts` — module-scope `mysql2/promise` pool on 127.0.0.1:3307.
- `app/vite.config.ts` — `sentryReactRouter({ sourcemaps: { disable: true } }, config)` and
  `ssr.noExternal: ["mysql2"]` so the orchestrion plugin transforms the driver.
- `app/build/` — the SSR/client build (4.4 MB) from the run below; `npx react-router build`
  regenerates it.
