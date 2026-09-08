# M-tanstack-bun — TanStack Start (React) on Bun with `@sentry/tanstackstart-react`

## What it reproduces

A TanStack Start (React) 1.168.35 app (`@tanstack/react-router` 1.170.18, nitro 3 beta `node-server`
preset) built with `vite build` and served on Bun with `bun --preload ./instrument.server.mjs
.output/server/index.mjs`, instrumented with `@sentry/tanstackstart-react` 10.67.0 from the develop
(v11) line. It exercises seven capabilities through API routes: errors, route names, request
isolation, incoming trace continuation, outgoing fetch propagation, database spans and logs. The
result is that only errors and logs work: on Bun the SDK cannot register the diagnostics-channel
injection hooks and cannot patch `node:http`, so no server root span exists, no isolation scope is
forked per request, incoming `sentry-trace` headers are ignored, outgoing `fetch` carries no
propagation headers, and a module-scope `mysql` query produces no span. The app also encodes two
build blockers found in the original probe: `sentryTanstackStart()` is absent from `vite.config.ts`
and every Sentry call in the server graph goes through `src/probe/sentry.ts`, a `globalThis` shim, so
that no `@sentry/*` specifier ever enters the rollup graph.

## Install

```
cd $REPRO/cells/M-tanstack-bun
npm install --no-audit --no-fund
```

All `@sentry/*` dependencies are `file:` references to the develop tarballs in
`../../_toolbox/pack/`, so this installs the SDK under test (10.67.0, develop / v11 line) and never
the released 10.73.0. `.output/` is checked in, so a rebuild is only needed after editing `src/`:

```
npx vite build
```

## Run

Requires MariaDB on `127.0.0.1:3307` (root, no password, database `app`, table `users`) for the db
probe.

```
cd $REPRO/cells/M-tanstack-bun

# 1. envelope sink (extended: keeps trace ids and tags, plus /__recorder and /__recorded)
PORT=48313 node sink.mjs > sink-rerun.log 2>&1 & SINK=$!

# 2. build + run the seven probes on bun (starts and stops the app itself)
npx vite build                       # only if .output/ is missing or src/ changed
APP_PORT=48311 SINK_PORT=48313 SUFFIX=rerun ./run-probes.sh

# 3. stop the sink
kill $SINK
```

`run-probes.sh` starts the app as

```
PORT=48311 PROBE_TUNNEL=http://127.0.0.1:48313/ PROBE_RECORDER=http://127.0.0.1:48313/__recorder \
PROBE_LIFECYCLE=static PROBE_DEBUG=1 \
  bun --preload ./instrument.server.mjs .output/server/index.mjs
```

and then curls `/api/error`, `/api/user/123`, `/`, three concurrent `/api/tag?tag=alpha|beta|gamma`,
`/api/error` with a `sentry-trace` header, `/api/fetch`, `/api/db-mysql`, `/api/log` and
`/api/sentinel`, writing `items-<suffix>.json` and `recorded-<suffix>.json`. Set
`PROBE_LIFECYCLE=stream SUFFIX=stream` for the span-streaming variant.

## Expected

Recorded verdicts (record id `M-tanstack-bun`):

| capability | verdict |
| --- | --- |
| errors | works |
| route names | broken |
| isolation | broken |
| incoming trace | broken |
| outgoing fetch | broken |
| db spans | broken |
| logs | works |
| client errors | not-run |

Recorded evidence lines:

```
Sentry init on bun (bun --preload ./instrument.server.mjs):
  [probe] sentry initialized, client = true
  Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
  Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
  Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
  Sentry Logger [log]: Integration installed: Http
  Sentry Logger [log]: Integration installed: NodeFetch
  Sentry Logger [log]: Integration installed: Mysql

errors (GET /api/error -> 500), then GET /api/user/123, then sentinel; sink /__items:
  {"type":"event","exception":"TanStack Bun API Route Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"sdk":"sentry.javascript.tanstackstart-react","trace_id":"cb920373c9c8468ea6e937e1bb372c04","span_id":"b777c8c49b2674b9","hasContextLine":true}
  {"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.tanstackstart-react","trace_id":"cb920373c9c8468ea6e937e1bb372c04","span_id":"a97e4f3da6c47019","hasContextLine":true}
  (no transaction/span item in the whole array)

isolation (three concurrent GET /api/tag, then sentinel):
  isolation-alpha | tags= {'probe_tag': 'gamma'} | trace= cb920373c9c8468ea6e937e1bb372c04
  isolation-gamma | tags= {'probe_tag': 'gamma'} | trace= cb920373c9c8468ea6e937e1bb372c04
  isolation-beta  | tags= {'probe_tag': 'gamma'} | trace= cb920373c9c8468ea6e937e1bb372c04
  sentinel        | tags= {'probe_tag': 'gamma'} | trace= cb920373c9c8468ea6e937e1bb372c04

incoming trace (sentry-trace aaaa...-bbbb...-1 sent to /api/error):
  {"type":"event","exception":"TanStack Bun API Route Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"tags":{"probe_tag":"gamma"},"trace_id":"cb920373c9c8468ea6e937e1bb372c04","span_id":"8756cb35eb65ce09","hasContextLine":true}

outgoing fetch (GET /api/fetch):
  {"downstream":{"recorded":true}}
  /__recorded -> [{"url":"/__recorder?from=tanstack-bun","sentryTrace":null,"baggage":null}]
  /__items    -> [{"type":"event","message":"sentinel",...}]   (no http.client span)

stream lifecycle (PROBE_LIFECYCLE=stream):
  [{"type":"event","exception":"TanStack Bun API Route Error",...},{"type":"event","message":"sentinel",...}]
  (still zero span envelopes)
```

## Observed on 2026-09-07

Rebuilt and run once, `traceLifecycle: 'static'`, app on 48311, sink on 48313. Startup log
(`app-rerun.log`):

```
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:mysql] subscribing to channels
Sentry Logger [log]: Integration installed: Mysql
Sentry Logger [log]: Integration installed: Http
Sentry Logger [log]: Integration installed: NodeFetch
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
[probe] sentry initialized, client = true
➜ Listening on: http://localhost:48311/ (all interfaces)
```

Probe run (`run-rerun.log`):

```
== baseline ping ==
{"ok":true,"runtime":"bun"}
== errors: GET /api/error ==
status=500
== route names: GET /api/user/123 and GET / ==
{"id":"123"}
ssr status=200
== isolation: three concurrent GET /api/tag ==
{"tag":"beta"}{"tag":"alpha"}{"tag":"gamma"}
== incoming trace: GET /api/error with sentry-trace ==
status=500
== outgoing fetch: GET /api/fetch ==
{"downstream":{"recorded":true}}
recorded: [{"url":"/__recorder?from=tanstack-bun","sentryTrace":null,"baggage":null}]
== db spans: GET /api/db-mysql ==
{"err":null,"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
== logs: GET /api/log ==
{"logged":true}
== sentinel ==
{"sentinel":true}
```

Sink `/__items` (`items-rerun.json`):

```
{"type": "event", "exception": "TanStack Bun API Route Error", "mechanism": "auto.middleware.tanstackstart.request", "handled": false, "sdk": "sentry.javascript.tanstackstart-react", "runtime": "node", "hasContextLine": true, "trace_id": "39dbb9d7b6ef43b2bafa0a6088e8b659", "span_id": "8221d67b8cc90fa6", "environment": "production"}
{"type": "event", "exception": "isolation-beta", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.tanstackstart-react", "runtime": "node", "hasContextLine": true, "trace_id": "39dbb9d7b6ef43b2bafa0a6088e8b659", "span_id": "b5bec45516c31091", "tags": {"probe_tag": "gamma"}, "environment": "production"}
{"type": "event", "exception": "isolation-alpha", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.tanstackstart-react", "runtime": "node", "hasContextLine": true, "trace_id": "39dbb9d7b6ef43b2bafa0a6088e8b659", "span_id": "a3c67a46c7d65644", "tags": {"probe_tag": "gamma"}, "environment": "production"}
{"type": "event", "exception": "isolation-gamma", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.tanstackstart-react", "runtime": "node", "hasContextLine": true, "trace_id": "39dbb9d7b6ef43b2bafa0a6088e8b659", "span_id": "88eefb3d3a6b3256", "tags": {"probe_tag": "gamma"}, "environment": "production"}
{"type": "event", "exception": "TanStack Bun API Route Error", "mechanism": "auto.middleware.tanstackstart.request", "handled": false, "sdk": "sentry.javascript.tanstackstart-react", "runtime": "node", "hasContextLine": true, "trace_id": "39dbb9d7b6ef43b2bafa0a6088e8b659", "span_id": "908f5028df69c530", "tags": {"probe_tag": "gamma"}, "environment": "production"}
{"type": "event", "message": "sentinel", "exception": "sentinel", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.tanstackstart-react", "runtime": "node", "hasContextLine": true, "trace_id": "39dbb9d7b6ef43b2bafa0a6088e8b659", "span_id": "bb9cfd3633a7873e", "tags": {"probe_tag": "gamma"}, "environment": "production"}
{"type": "log", "items": ["info: tanstack-bun-log-probe"]}
```

Per capability:

- errors — matches (`works`): the thrown route error arrives with mechanism
  `auto.middleware.tanstackstart.request`, `handled: false`, a context line, and the route returns 500.
- route names — matches (`broken`): zero `transaction` and zero `span` items for `/api/user/123` or
  the SSR `/`; the array holds only events and one log item.
- isolation — matches (`broken`): `isolation-alpha`, `isolation-beta` and `isolation-gamma` all carry
  `{"probe_tag": "gamma"}` and the single process-global trace id
  `39dbb9d7b6ef43b2bafa0a6088e8b659`, which the later separate sentinel request shares.
- incoming trace — matches (`broken`): the request sent with
  `sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1` produced an event with
  `trace_id 39dbb9d7b6ef43b2bafa0a6088e8b659` and no `parent_span_id`; the header was ignored.
- outgoing fetch — matches (`broken`): the recorder saw
  `{"url":"/__recorder?from=tanstack-bun","sentryTrace":null,"baggage":null}` and no `http.client`
  span was emitted.
- db spans — matches (`broken`): the module-scope `mysql` query returned
  `[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]` and produced no db span.
- logs — matches (`works`): `{"type": "log", "items": ["info: tanstack-bun-log-probe"]}` arrived after
  the flush timer.
- client errors — `not-run`, as recorded: no browser SDK is loaded in this build.

All eight recorded verdicts reproduce. The only environment difference is Bun: the record says 1.4.0,
this machine now has 1.4.2, and every verdict is unchanged on it. Trace and span ids differ from the
record because they are generated per run; the shape (one process-global trace id shared by every
event) is identical. The `stream` lifecycle variant was not re-run this time; the static run alone
already carries every verdict.
