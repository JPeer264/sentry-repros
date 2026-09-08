# M-nuxt-cf — Nuxt 4 (nitro `cloudflare_module`) on Cloudflare Workers

## What it reproduces

A Nuxt 4 app built with the nitro `cloudflare_module` preset and served by `wrangler dev` (workerd,
`nodejs_compat`, `compatibility_date` 2026-05-01), instrumented by the develop SDK (`@sentry/nuxt` +
`@sentry/cloudflare` at 10.67.0) through `sentryCloudflareNitroPlugin` in `server/plugins/sentry.ts`.
It exercises seven capabilities from Nitro server routes under `server/api/`: unhandled route errors,
route names (parameterized and non-parameterized), per-request isolation under concurrency, incoming
`sentry-trace`/`baggage` continuation, outgoing `fetch` spans with propagated headers, `mysql` database
spans, and `Sentry.logger` logs. No Vite plugin, no bundler plugin and no manual instrumentation step
is added: `@sentry/nuxt/module` detects the `cloudflare*` preset and pushes `sentryOrchestrionPlugin`
into the Nitro rollup config itself. The one soft spot it demonstrates is route naming for
non-parameterized server routes, which under the develop default `traceLifecycle: 'stream'` leaves the
segment named by method only.

## Install

```
S=$SCRATCH

cd $REPRO/cells/M-nuxt-cf
npm install --no-audit --no-fund   # the `nuxt prepare` postinstall fails here; that is expected
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-nuxt-10.67.0.tgz $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-vue-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-browser-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-replay-10.67.0.tgz $REPRO/_toolbox/pack/sentry-replay-canvas-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-feedback-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz
npx nuxt prepare
```

The tarballs are also mirrored at `$REPRO/_toolbox/pack`.
MariaDB must be reachable on `127.0.0.1:3307` (root, no password, database `app`, table `users`).

## Run

```
cd $REPRO/cells/M-nuxt-cf

# sink (also acts as the outgoing-fetch header recorder on /__record)
RAW=$PWD/raw-static.log PORT=39411 node sink2.mjs > sink-static.log 2>&1 &

# build + serve
npx nuxt build
npx wrangler dev --port 52719 --inspector-port 0 > wrangler-static.log 2>&1 &
# wait for: Ready on http://localhost:52719

# probes
curl -s http://127.0.0.1:52719/api/error
curl -s http://127.0.0.1:52719/api/users/42
for t in alpha beta gamma; do curl -s "http://127.0.0.1:52719/api/iso?tag=$t" & done; wait
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
     -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' \
     http://127.0.0.1:52719/api/users/7
curl -s http://127.0.0.1:52719/api/fetchout
curl -s http://127.0.0.1:52719/api/db
curl -s http://127.0.0.1:52719/api/log
curl -s http://127.0.0.1:52719/api/log2      # same probe, importing @sentry/nuxt instead of @sentry/cloudflare
curl -s http://127.0.0.1:52719/api/sentinel  # sentinel: wait until it appears in the sink
curl -s http://127.0.0.1:39411/__items
curl -s http://127.0.0.1:39411/__recorded    # headers the fetch recorder saw
```

Wait for the sentinel event before reading `/__items`, and give logs another 8s for their flush timer.

`server/plugins/sentry.ts` ships with `traceLifecycle: 'static'` commented out, so a fresh checkout
runs on the develop default `'stream'`. Uncomment that line and rebuild for the `static` evidence
below; comment it out and rebuild for the `stream` evidence.

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | **partial** |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | works |
| logs | works |

Route names is the only partial: parameterized routes are correct in both lifecycles, but a
non-parameterized route gets no route attribute at all, because `updateRouteBeforeResponse`
(`packages/nuxt/src/runtime/hooks/updateRouteBeforeResponse.ts:17-40`) only sets it when
`matchedRoute.path !== event.path`. Under `stream` that route's segment is the method-only
`http.server GET`; under `static` it still reads `GET /api/db` with `source: "url"`.

Recorded evidence lines (`traceLifecycle: 'static'`):

```
{"type":"event","exception":"nuxt-cf-route-error","mechanism":"chained","handled":true,"sdk":"sentry.javascript.cloudflare","trace_id":"d13b15fae8f84739b8b006a4eb6a5fca","transaction":"GET /api/error","runtime":"cloudflare","hasContextLine":false}
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"url","status":"internal_error","trace_id":"d13b15fae8f84739b8b006a4eb6a5fca","spans":[]}
(raw exception values of that same event)
Error | nuxt-cf-route-error | {"handled": true, "type": "chained", "source": "cause", "exception_id": 1, "parent_id": 0}
Error | nuxt-cf-route-error | {"type": "auto.function.nuxt.nitro", "handled": false, "exception_id": 0}

{"type":"transaction","name":"GET /api/users/:id","op":"http.server","source":"route","status":"ok","trace_id":"ceb7414472bf4ca5813f4f3470b9df64","spans":[]}

isolation (3 concurrent):
{"type":"event","exception":"iso-error-alpha","mechanism":"generic","handled":true,"tags":{"probe-tag":"alpha"},"trace_id":"fdefc3faa8094273bd9219415b8d4267","runtime":"cloudflare"}
{"type":"event","exception":"iso-error-gamma","mechanism":"generic","handled":true,"tags":{"probe-tag":"gamma"},"trace_id":"b935d19f11e14d969df8d5d2bbdd2e9f","runtime":"cloudflare"}
{"type":"event","exception":"iso-error-beta","mechanism":"generic","handled":true,"tags":{"probe-tag":"beta"},"trace_id":"f2795b5364c6445f8a2515ef47072199","runtime":"cloudflare"}
{"type":"transaction","name":"GET /api/iso","source":"route","trace_id":"fdefc3faa8094273bd9219415b8d4267","tags":{"probe-tag":"alpha"}}
{"type":"transaction","name":"GET /api/iso","source":"route","trace_id":"b935d19f11e14d969df8d5d2bbdd2e9f","tags":{"probe-tag":"gamma"}}
{"type":"transaction","name":"GET /api/iso","source":"route","trace_id":"f2795b5364c6445f8a2515ef47072199","tags":{"probe-tag":"beta"}}

incoming trace:
{"type":"transaction","name":"GET /api/users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}

outgoing fetch + db + logs (static):
{"type":"transaction","name":"GET /api/fetchout","op":"http.server","source":"url","status":"ok","trace_id":"c604f8628ef7475b823ff67242e2c7c4","spans":["http.client GET http://127.0.0.1:39411/__record"]}
{"type":"transaction","name":"GET /api/db","op":"http.server","source":"url","status":"ok","trace_id":"a7a01b6c933f4b43a4dc8e5b0df4430e","spans":["db SELECT id, name FROM users"]}
{"type":"log","items":["info: nuxt-cf-log-probe"],"trace_ids":["9fb97d615781445ba2f9912f7945d239"]}
recorder headers seen on the outgoing fetch:
[{"url":"/__record?from=nuxt","headers":{"host":"127.0.0.1:39411","cf-worker":"m-nuxt-cf.example.com","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=01ced24e673840b98ee85acecf50f123,sentry-sampled=true,sentry-sample_rand=0.2769301575432156,sentry-sample_rate=1","sentry-trace":"01ced24e673840b98ee85acecf50f123-8ef58a67958be52c-1"}}]
```

Recorded `stream` behavior (the record's `traceLifecycle: 'stream'` evidence block is truncated in
`_records/cells.json`; these claims come from the capability details): segment
`http.server GET /api/users/:id` with `sentry.segment.name.source: "route"`,
`http.route: "/api/users/:id"`, `url.path.parameter.id: "42"`, `params.id: "42"`; outgoing fetch
`http.client GET 127.0.0.1` with `parent_span_id` set; db span `SELECT users` with
`sentry.origin: auto.db.mysql`, `sentry.kind: client`; a non-parameterized route's segment is the
method-only `http.server GET`.

## Observed on 2026-09-07

Matches the recorded verdict on all seven capabilities. Verbatim trimmed output.

`traceLifecycle: 'static'` — `curl -s http://127.0.0.1:39411/__items`:

```
{"type": "transaction", "name": "GET /api/hello", "op": "http.server", "source": "url", "status": "ok", "trace_id": "56884f4432cf48fc9aa06371c463facf"}
{"type": "event", "exception": "nuxt-cf-route-error", "mechanism": "chained", "handled": true, "sdk": "sentry.javascript.cloudflare", "trace_id": "9b52d6c254424648861a78f5b332a845", "transaction": "GET /api/error", "runtime": "cloudflare", "hasContextLine": false}
{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "9b52d6c254424648861a78f5b332a845"}
{"type": "transaction", "name": "GET /api/users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "02d97abbe0bc44fda0169878e78de6d2", "route": "/api/users/:id"}
{"type": "event", "exception": "iso-error-alpha", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.cloudflare", "tags": {"probe-tag": "alpha"}, "trace_id": "0fca47793407414da21798fccad54604", "runtime": "cloudflare", "hasContextLine": false}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "0fca47793407414da21798fccad54604", "route": "/api/iso", "tags": {"probe-tag": "alpha"}}
{"type": "event", "exception": "iso-error-gamma", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.cloudflare", "tags": {"probe-tag": "gamma"}, "trace_id": "831fe7390a464161b9d35ad244c3dc9c", "runtime": "cloudflare", "hasContextLine": false}
{"type": "event", "exception": "iso-error-beta", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.cloudflare", "tags": {"probe-tag": "beta"}, "trace_id": "1c6e4d63271849d293b2ea61cb749090", "runtime": "cloudflare", "hasContextLine": false}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "831fe7390a464161b9d35ad244c3dc9c", "route": "/api/iso", "tags": {"probe-tag": "gamma"}}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "1c6e4d63271849d293b2ea61cb749090", "route": "/api/iso", "tags": {"probe-tag": "beta"}}
{"type": "transaction", "name": "GET /api/users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "bbbbbbbbbbbbbbbb", "route": "/api/users/:id"}
{"type": "transaction", "name": "GET /api/fetchout", "op": "http.server", "source": "url", "status": "ok", "trace_id": "eb58ef95fcaa4c2492e0d7de967bb7bb", "spans": ["http.client GET http://127.0.0.1:39411/__record"]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "url", "status": "ok", "trace_id": "49ddb4e4f6fd48f7a5ac0e503c3f1cfb", "spans": ["db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /api/log", "op": "http.server", "source": "url", "status": "ok", "trace_id": "959f8e84c01449aea49f310cad03e96e"}
{"type": "log", "items": ["info: nuxt-cf-log-probe"], "trace_ids": ["959f8e84c01449aea49f310cad03e96e"]}
{"type": "transaction", "name": "GET /api/log2", "op": "http.server", "source": "url", "status": "ok", "trace_id": "6df4d0b1e85d487893df582703506765"}
{"type": "log", "items": ["info: nuxt-import-log-probe"], "trace_ids": ["6df4d0b1e85d487893df582703506765"]}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.cloudflare", "trace_id": "8640663e422a488daa2d519f76371e5d", "runtime": "cloudflare"}
{"type": "transaction", "name": "GET /api/sentinel", "op": "http.server", "source": "url", "status": "ok", "trace_id": "8640663e422a488daa2d519f76371e5d"}
```

Raw exception values of the `/api/error` event (from `raw-static.log`):

```
Error | nuxt-cf-route-error | {"handled": true, "type": "chained", "source": "cause", "exception_id": 1, "parent_id": 0}
Error | nuxt-cf-route-error | {"type": "auto.function.nuxt.nitro", "handled": false, "exception_id": 0}
```

`curl -s http://127.0.0.1:39411/__recorded`:

```
{"url": "/__record?from=nuxt", "headers": {"host": "127.0.0.1:39411", "cf-worker": "m-nuxt-cf.example.com", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=eb58ef95fcaa4c2492e0d7de967bb7bb,sentry-sampled=true,sentry-sample_rand=0.08192417963752674,sentry-sample_rate=1", "sentry-trace": "eb58ef95fcaa4c2492e0d7de967bb7bb-83537f027e83189c-1"}}
```

`traceLifecycle: 'stream'` (the develop default), span items flattened to their attributes:

```
{"type": "event", "exception": "nuxt-cf-route-error", "mechanism": "chained", "handled": true, "sdk": "sentry.javascript.cloudflare", "trace_id": "c42169c4d5d54b1e8c33faddb8361866", "transaction": "GET /api/error", "runtime": "cloudflare", "hasContextLine": false}
{"name": "GET", "trace_id": "c42169c4d5d54b1e8c33faddb8361866", "is_segment": true, "op": "http.server", "origin": "auto.http.cloudflare", "segment_source": "url"}
{"name": "GET /api/users/:id", "trace_id": "0e57c4aa6d0d45cf9f353efd70f6985a", "is_segment": true, "op": "http.server", "origin": "auto.http.cloudflare", "segment_source": "route", "http_route": "/api/users/:id", "param_id": "42"}
{"name": "GET 127.0.0.1", "trace_id": "0699ff4e8cc74287843be55286648a08", "parent_span_id": "88ae194e7673a17c", "is_segment": false, "op": "http.client", "origin": "auto.http.fetch"}
{"name": "GET", "trace_id": "0699ff4e8cc74287843be55286648a08", "is_segment": true, "op": "http.server", "origin": "auto.http.cloudflare", "segment_source": "url"}
{"name": "SELECT users", "trace_id": "e240b8d48ce542419552abcd64db3b81", "parent_span_id": "8489946fd75ce0b3", "is_segment": false, "op": "db", "origin": "auto.db.mysql", "kind": "client", "db_query": "SELECT id, name FROM users"}
{"name": "GET", "trace_id": "e240b8d48ce542419552abcd64db3b81", "is_segment": true, "op": "http.server", "origin": "auto.http.cloudflare", "segment_source": "url"}
{"type": "log", "items": ["info: nuxt-cf-log-probe"], "trace_ids": ["0bb590d769d34bb6919b13d48c25d8d4"]}
{"name": "GET", "trace_id": "0bb590d769d34bb6919b13d48c25d8d4", "is_segment": true, "op": "http.server", "origin": "auto.http.cloudflare", "segment_source": "url"}
```

Per capability:

- errors — **works**, matches. Same `mechanism.type: "auto.function.nuxt.nitro"` / `handled: false` on the root exception value, chained through Nitro's `error` hook, `transaction: "GET /api/error"`, `sdk: sentry.javascript.cloudflare`, HTTP 500 returned.
- route names — **partial**, matches. `/api/users/:id` is correct in both lifecycles (`source: "route"`, `http.route`, `param_id: "42"`); the non-parameterized `/api/db` and `/api/error` get no route attribute and are named `GET` only under `stream`.
- isolation — **works**, matches. Three concurrent `/api/iso` requests, three distinct trace ids, exactly one `probe-tag` each on both event and transaction, no cross-talk.
- incoming trace — **works**, matches. `trace_id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"`, `parent_span_id: "bbbbbbbbbbbbbbbb"`, route still `/api/users/:id`.
- outgoing fetch — **works**, matches. `http.client GET http://127.0.0.1:39411/__record` under `static`, `http.client GET 127.0.0.1` with a parent under `stream`; the recorder saw `sentry-trace` and `baggage` on the same trace id as the server span.
- db spans — **works**, matches. Module-scope `mysql.createConnection` against MariaDB 3307 gives `db SELECT id, name FROM users` (static) and `SELECT users` with `auto.db.mysql` / `client` (stream), with no manual instrumentation step.
- logs — **works**, matches. `info: nuxt-cf-log-probe` (imported from `@sentry/cloudflare`) and `info: nuxt-import-log-probe` (imported from `@sentry/nuxt`) both arrive carrying the request trace id.

Differences from the record, none of them behavioral: npm resolved `nuxt@^4.1.2` to **4.5.2** rather
than the recorded 4.2.x (wrangler still landed on the recorded 4.129.0), and this rebuild uses a single
`sink2.mjs` on port 39411 that both parses envelopes and records outgoing-fetch headers on `/__record`,
so trace ids differ from the recorded run. The `/api/hello` viability route from the record's notes is
kept in the app and still answers `{"ok":true}`.
