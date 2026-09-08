# M-astro-deno

Astro 7.3.1 SSR (`output: 'server'`) with `@deno/astro-adapter` 0.6.0 and `@sentry/astro` 10.67.0
(develop, `6f2da7483d`) on Deno 2.9.0, serving the built `dist/server/entry.mjs`.

## What it reproduces

An Astro app built for the Deno adapter and run by `deno run` on the built server entry, instrumented
with the `sentry()` Astro integration (server only), exercising the seven capabilities of the
framework matrix: errors, route names, request isolation, incoming trace continuation, outgoing
`fetch`, database spans and logs. Six of the seven work: errors arrive through the auto-added
`@sentry/astro/middleware` with `mechanism: "auto.middleware.astro"`, transactions and spans carry
Astro's own route pattern (`GET /users/[id]`), concurrent requests keep their own tags and trace ids,
an incoming `sentry-trace`/`baggage` pair is continued, module-scope `mysql2` produces `db` spans via
the `sentryOrchestrionPlugin` that `@sentry/astro` adds to the Vite build by itself, and
`Sentry.logger.info` reaches the sink. The one hole is **outgoing `fetch`**, which produces no
`http.client` span and sends no `sentry-trace`/`baggage` header, so a distributed trace breaks
silently at the first hop; `node:http` from the same handler propagates both, which places the gap in
Deno's `fetch` rather than in Astro (the known Deno gap K2). A second, documentation-shaped finding:
`@sentry/astro` injects the server init with `injectScript('page-ssr', …)`, which Astro applies only
to `.astro` page components, so an app whose routes are `.ts`/`.js` endpoints needs a
`src/middleware.ts` that imports `sentry.server.config.js` on its first line, or `Sentry.init` never
runs for those routes. This rebuild includes that middleware; the build output still shows the gap
(`dist/server/chunks/boom_*.mjs` contains no Sentry reference at all, while the middleware chunk
`dist/server/virtual_astro_middleware.mjs` imports both `sentry.server.config` and
`@sentry/astro/middleware`).

Files: `astro.config.mjs` (adapter + integration), `sentry.server.config.js` (init, picked up by the
integration), `src/middleware.ts` (the required extra step), `src/pages/*` (the probe routes:
`boom.ts`, `users/[id].ts`, `db.ts`, `outfetch.ts`, `outhttp.ts`, `log.ts`, `iso.ts`, `sentinel.ts`
plus one `index.astro`), and `sink2.mjs` (the envelope sink from `_toolbox` extended with trace/span
ids, tags, `http.route`, `db.query.text` and a `/rec` endpoint that records the headers of incoming
downstream requests).

Deviation from the record: the record set `traceLifecycle` and the sink port literally in
`sentry.server.config.js` and rebuilt between the two lifecycles. Here both are read from the Deno
environment at runtime (`SENTRY_LIFECYCLE`, `SINK_PORT`), so one build covers both lifecycles. The app
listens on 47313 and the sink on 47312; the record used 41337 and 44551.

`observed-*.json` are the sink dumps quoted under "Observed" below. `run-*.log` are the stdout of the
two app runs, `build-stream.log` the build output, `sink.log` the sink stdout.

## Install

```
cd $REPRO/cells/M-astro-deno && npm install --no-audit --no-fund
```

`package.json` pins the twelve SDK tarballs by relative path under `_toolbox/pack`
(`@sentry/{astro,browser,browser-utils,bundler-plugins,core,feedback,node,opentelemetry,replay,replay-canvas,server-runtime-injection,server-utils}`
at 10.67.0) plus `astro@7.3.1`, `@deno/astro-adapter@0.6.0` and `mysql2`, so a bare `npm install`
restores `node_modules`. MariaDB must be reachable on `127.0.0.1:3307` (user `root`, no password,
database `app`, table `users`). `dist/` is checked in (1.4 MB), so the app can be run without a
rebuild; `npx astro build` regenerates it.

## Run

```
cd $REPRO/cells/M-astro-deno

# sink + downstream header recorder on 47312
PORT=47312 node sink2.mjs > sink.log 2>&1 &

npx astro build                                   # only if dist/ is missing or stale

# app, static lifecycle (transaction envelopes with source and nested spans[])
SINK_PORT=47312 SENTRY_LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-run \
  dist/server/entry.mjs > run-static.log 2>&1 &

# drive, from plain curl so no client-side sentry-trace pollutes sampling
B=http://127.0.0.1:47313
curl -s $B/boom
curl -s $B/users/42
TID=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
curl -s -H "sentry-trace: $TID-bbbbbbbbbbbbbbbb-1" \
        -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" \
        $B/users/99
curl -s $B/db
curl -s $B/outfetch
curl -s $B/outhttp
curl -s $B/log
curl -s "$B/iso?tag=alpha" & curl -s "$B/iso?tag=beta" & curl -s "$B/iso?tag=gamma" & wait
curl -s "$B/sentinel?n=1"                         # sentinel; read the sink once it appears

# read
curl -s http://127.0.0.1:47312/__items
curl -s http://127.0.0.1:47312/__reqs
curl -s -X DELETE http://127.0.0.1:47312/__items
curl -s -X DELETE http://127.0.0.1:47312/__reqs

# default stream lifecycle (span envelopes): drop SENTRY_LIFECYCLE=static, restart, drive again
```

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** |
| db spans | works |
| logs | works |

Recorded evidence lines:

```
--- errors (static lifecycle, sink /__items) ---
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"5434b94f9c344e3bbaed021dbd02cf6e","spans":[]}
{"type":"event","exception":"astro-deno-route-error","mechanism":"auto.middleware.astro","handled":false,"trace_id":"5434b94f9c344e3bbaed021dbd02cf6e","transaction":"GET /boom","request":"http://127.0.0.1:41337/boom","sdk":"sentry.javascript.astro","hasContextLine":true}

--- route names + incoming trace (static lifecycle) ---
{"type":"transaction","name":"GET /users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"b09bb703d135466f8df7c72b41832ce0","spans":[]}
{"type":"transaction","name":"GET /users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}

--- route names (stream lifecycle span envelope) ---
{"type":"span","items":[{"n":"http.server GET /users/[id]","trace_id":"382f6f1e253a4ffc951d170afcabe4ab"}]}
{"type":"span","items":[{"n":"http.server GET /users/[id]","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"bbbbbbbbbbbbbbbb"}]}

--- isolation, 3 concurrent requests (stream lifecycle) ---
{"type":"event","exception":"iso-error-alpha","mechanism":"generic","handled":true,"tags":{"probe_tag":"alpha"},"trace_id":"09c27b29165f41659562db300930aa69","transaction":"GET /iso",...}
{"type":"event","exception":"iso-error-beta","mechanism":"generic","handled":true,"tags":{"probe_tag":"beta"},"trace_id":"d1916f863a4445a5970c3e0d6cb445ae","transaction":"GET /iso",...}
{"type":"event","exception":"iso-error-gamma","mechanism":"generic","handled":true,"tags":{"probe_tag":"gamma"},"trace_id":"e90540e6180846f39a72343cef4e335e","transaction":"GET /iso",...}

--- db spans (static lifecycle) ---
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"461871a3759a4be39ffab259a5c913e9","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
--- db spans (stream lifecycle, with db.query.text) ---
{"type":"span","items":[{"n":"db mysql2.pool.connect",...},{"n":"db mysql2.connect",...},{"n":"db SELECT users","trace_id":"21193d44349744fdbf36c11645a8ba69","parent":"9b60220bc9d2b41b","db":"SELECT id, name FROM users"},{"n":"http.server GET /db",...}]}

--- outgoing fetch: no span, no headers; node:http: span + headers ---
{"type":"transaction","name":"GET /outfetch","op":"http.server","source":"route","status":"ok","trace_id":"115c487fed2a437bb34f697ee1d30903","spans":[]}
{"type":"transaction","name":"GET /outhttp","op":"http.server","source":"route","status":"ok","trace_id":"3104cf95070f4382a468649a14ddfdd7","spans":["http.client GET http://127.0.0.1:44551/rec"]}
recorder /__rec:
[{"url":"/rec?from=node-http","st":"3104cf95070f4382a468649a14ddfdd7-9ff05d85c2c9e501-1","bag":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=3104cf95070f4382a4…

--- logs ---
{"type":"log","items":["info: astro-deno-log-line"]}
```

## Observed on 2026-09-07

Rebuilt and run once. **All seven capabilities match the record**, including the `fetch` hole. Trace
ids and the port numbers differ per run, as they must. The build printed the same benign
`[IMPORT_IS_UNDEFINED] Import 'start' will always be undefined …` rolldown warning from
`node_modules/@deno/astro-adapter/src/server.ts:87` that the record notes.

Static lifecycle (`observed-static-items.json`, nulls trimmed):

```
{"type": "transaction", "name": "GET /boom", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "26645e1db341423a9c20c4439c910833", "span_id": "aea2d641f254ee4d", "sdk": "sentry.javascript.astro", "http_route": "/boom", "spans": []}
{"type": "event", "exception": "Error: astro-deno-route-error", "mechanism": "auto.middleware.astro", "handled": false, "sdk": "sentry.javascript.astro", "transaction": "GET /boom", "trace_id": "26645e1db341423a9c20c4439c910833", "hasContextLine": true}
{"type": "transaction", "name": "GET /users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "61be6a04735e40bf93fbcba2d18d011d", "span_id": "adeba11bf903888b", "sdk": "sentry.javascript.astro", "http_route": "/users/[id]", "spans": []}
{"type": "transaction", "name": "GET /users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "span_id": "810370da5fb702a7", "parent_span_id": "bbbbbbbbbbbbbbbb", "sdk": "sentry.javascript.astro", "http_route": "/users/[id]", "spans": []}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "badb91cb183c44a0923fa5272a397116", "span_id": "9a00976052cc050e", "sdk": "sentry.javascript.astro", "http_route": "/db", "spans": ["db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /outfetch", "op": "http.server", "source": "route", "status": "ok", "trace_id": "193012971ac34cf19d6e3f4d1b5d0034", "span_id": "9fcad0d0928e0ad4", "sdk": "sentry.javascript.astro", "http_route": "/outfetch", "spans": []}
{"type": "transaction", "name": "GET /outhttp", "op": "http.server", "source": "route", "status": "ok", "trace_id": "b4566056079b496a9427d5069481bfe2", "span_id": "bd20cfeee6fc6907", "sdk": "sentry.javascript.astro", "http_route": "/outhttp", "spans": ["http.client GET http://127.0.0.1:47312/rec"]}
{"type": "transaction", "name": "GET /iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "5ea052d3e36f49c9b4357b2137c056ba", "span_id": "a74b4f6e0bb9a8ea", "sdk": "sentry.javascript.astro", "tags": {"probe_tag": "beta"}, "http_route": "/iso", "spans": []}
{"type": "event", "exception": "Error: iso-error-beta", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.astro", "transaction": "GET /iso", "tags": {"probe_tag": "beta"}, "trace_id": "5ea052d3e36f49c9b4357b2137c056ba", "hasContextLine": true}
{"type": "event", "exception": "Error: iso-error-alpha", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.astro", "transaction": "GET /iso", "tags": {"probe_tag": "alpha"}, "trace_id": "474fc306623b485ab1f77eda0d2e5bed", "hasContextLine": true}
{"type": "event", "exception": "Error: iso-error-gamma", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.astro", "transaction": "GET /iso", "tags": {"probe_tag": "gamma"}, "trace_id": "30196e957d63475996f3ac957d829fdd", "hasContextLine": true}
{"type": "log", "items": ["info: astro-deno-log-line"]}
```

Downstream header recorder, static run (`observed-static-reqs.json`) — the whole `fetch` finding in
two rows:

```
{"url": "/rec?from=fetch", "method": "GET", "sentryTrace": null, "baggage": null, "traceparent": null}
{"url": "/rec?from=node-http", "method": "GET", "sentryTrace": "b4566056079b496a9427d5069481bfe2-93820b57d305049e-1", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=b4566056079b496a9427d5069481bfe2,sentry-transaction=GET%20%2Fouthttp,sentry-sampled=true,sentry-sample_rand=0.2840049385436668,sentry-sample_rate=1", "traceparent": null}
```

Default stream lifecycle (`observed-stream-items.json`, nulls trimmed):

```
{"type": "span", "items": [{"n": "http.server GET /users/[id]", "trace_id": "63a51b18bfa04317867dd728bd7de0cb", "span_id": "bea8a63c41e5831b", "source": "route", "route": "/users/[id]", "seg": "GET /users/[id]"}]}
{"type": "span", "items": [{"n": "http.server GET /users/[id]", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "span_id": "9271bc07c0757194", "parent_span_id": "bbbbbbbbbbbbbbbb", "source": "route", "route": "/users/[id]", "seg": "GET /users/[id]"}]}
{"type": "span", "items": [{"n": "db mysql2.pool.connect", "trace_id": "1d6b2a06144640688f00497208dde652", "span_id": "b7b1b51000e40858", "parent_span_id": "95e844b0b02670bb", "seg": "GET /db"}, {"n": "db mysql2.connect", "trace_id": "1d6b2a06144640688f00497208dde652", "span_id": "91f3d02e1d79da64", "parent_span_id": "b7b1b51000e40858", "seg": "GET /db"}, {"n": "db SELECT users", "trace_id": "1d6b2a06144640688f00497208dde652", "span_id": "a4b4dd37be70c311", "parent_span_id": "95e844b0b02670bb", "seg": "GET /db", "db": "SELECT id, name FROM users"}, {"n": "http.server GET /db", "trace_id": "1d6b2a06144640688f00497208dde652", "span_id": "95e844b0b02670bb", "source": "route", "route": "/db", "seg": "GET /db"}]}
{"type": "span", "items": [{"n": "http.server GET /outfetch", "trace_id": "93250c41f012423298e3b12800725534", "span_id": "a4b984b554e2fe17", "source": "route", "route": "/outfetch", "seg": "GET /outfetch"}]}
{"type": "span", "items": [{"n": "http.client GET 127.0.0.1", "trace_id": "f98830ab7eb1450f8efafb9b5cf46f51", "span_id": "b75bbc440c3c697e", "parent_span_id": "bf5534b4c06b450e", "seg": "GET /outhttp"}, {"n": "http.server GET /outhttp", "trace_id": "f98830ab7eb1450f8efafb9b5cf46f51", "span_id": "bf5534b4c06b450e", "source": "route", "route": "/outhttp", "seg": "GET /outhttp"}]}
{"type": "event", "exception": "Error: astro-deno-route-error", "mechanism": "auto.middleware.astro", "handled": false, "sdk": "sentry.javascript.astro", "transaction": "GET /boom", "trace_id": "ff8b8eac76974dac97dfefe2d9a433e2", "hasContextLine": true}
{"type": "log", "items": ["info: astro-deno-log-line"]}
```

Per-capability comparison:

- **errors** — matches. `GET /boom` returns 500, the event carries `mechanism: "auto.middleware.astro"`, `handled: false`, `transaction: "GET /boom"`, `sdk: sentry.javascript.astro` and source context lines, and in static lifecycle the transaction is `internal_error` on the same trace id.
- **route names** — matches. `/users/42` produces `GET /users/[id]` with `source: "route"` and `http.route: "/users/[id]"` in static, and `http.server GET /users/[id]` in the stream span envelope. Astro's route pattern, not the URL.
- **isolation** — matches. Three concurrent `/iso?tag=…` requests produced three events with exactly their own tag and three distinct trace ids, no cross-talk, in both lifecycles.
- **incoming trace** — matches. `trace_id: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, `parent_span_id: bbbbbbbbbbbbbbbb`, confirmed in both lifecycles.
- **outgoing fetch** — matches the recorded **broken**. `GET /outfetch` has `spans: []` in static and a lone `http.server` span in stream, and the recorder saw no `sentry-trace` and no `baggage`. `node:http` from `/outhttp` in the same app got both, with an `http.client` span.
- **db spans** — matches. `db mysql2.pool.connect`, `db mysql2.connect` and `db SELECT id, name FROM users` in static; in stream the same three parented to the `http.server GET /db` span, with `db SELECT users` carrying `db.query.text: "SELECT id, name FROM users"`. The built `dist/server/chunks/db_*.mjs` contains 178 `orchestrion` markers, the instrumentation path the record names.
- **logs** — matches. `{"type": "log", "items": ["info: astro-deno-log-line"]}` in both lifecycles.
