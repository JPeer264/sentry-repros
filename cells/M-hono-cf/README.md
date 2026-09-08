# M-hono-cf — Hono 4 with `@sentry/hono/cloudflare` on Cloudflare Workers

## What it reproduces

A Hono 4 app running on Cloudflare Workers (wrangler 4.129.0 dev / workerd, `compatibility_date`
2026-05-01, `nodejs_compat`) instrumented with `@sentry/hono/cloudflare` at SDK 10.67.0 built from
`develop`. `sentry(app, options)` is the whole wiring: it is the first `app.use`, it calls
`withSentry((env) => options, app)` internally, which mutates `app.fetch` in place, so the plain
`export default app` stays correct and there is no separate instrument file. The app exercises
errors thrown in a handler, parameterized route names, per-request isolation under concurrency,
incoming `sentry-trace` continuation, outgoing `fetch` spans and headers, mysql db spans, and logs.
Everything but db spans works under plain `wrangler dev`; the db span appears only when the worker is
built through the Cloudflare Vite plugin, whose `buildTimeInstrumentation` injects the
`orchestrion:mysql:query` diagnostics channel into the bundle. `/db` under plain `wrangler dev` is
the negative control for that.

## Install

```
S=$SCRATCH
cd $REPRO/cells/M-hono-cf
npm install --no-audit --no-fund \
  $S/pack/sentry-hono-10.67.0.tgz $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz \
  $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  hono@^4 mysql@^2.18.1 wrangler@^4 vite@^6 @cloudflare/vite-plugin@^1
```

The same tarballs are mirrored in `$REPRO/_toolbox/pack`.
MariaDB must be reachable on `127.0.0.1:3307` (user `root`, no password, db `app`, table `users`).

## Run

The sink port `41207` is hardcoded in `src/index.ts` (DSN `http://abc123@127.0.0.1:41207/1`, tunnel
`http://127.0.0.1:41207/`). Change both together if the port is taken.

```
cd $REPRO/cells/M-hono-cf

# 1. sink (extended: keeps trace ids, tags, span attrs; /__rec is the fetch recorder, /__recs reads it)
PORT=41207 node sink2.mjs > sink2.log 2>&1 &

# 2. stream lifecycle, plain wrangler dev
#    (errors, route names, isolation, incoming trace, outgoing fetch, logs, db negative control)
npx wrangler dev --port 47612 --inspector-port 0 > dev2.log 2>&1 &
curl -s http://127.0.0.1:47612/users/42
curl -s http://127.0.0.1:47612/boom/7
curl -s http://127.0.0.1:47612/iso/aaa & curl -s http://127.0.0.1:47612/iso/bbb & curl -s http://127.0.0.1:47612/iso/ccc & wait
curl -s -H "sentry-trace: 11111111111111111111111111111111-2222222222222222-1" \
        -H "baggage: sentry-trace_id=11111111111111111111111111111111,sentry-public_key=abc123,sentry-sample_rate=1,sentry-sampled=true" \
        http://127.0.0.1:47612/users/99
curl -s http://127.0.0.1:47612/fetchout
curl -s http://127.0.0.1:47612/log      # logs are timer-flushed, poll for the log item
curl -s http://127.0.0.1:47612/db       # negative control: no db span without the Vite build
curl -s http://127.0.0.1:47612/sentinel # poll __items until message==="sentinel" appears
curl -s http://127.0.0.1:41207/__items
curl -s "http://127.0.0.1:41207/__items?raw=1"   # raw span attributes
curl -s http://127.0.0.1:41207/__recs

# 3. static lifecycle + Vite plugin build (db spans, span nesting)
curl -s -X DELETE http://127.0.0.1:41207/__items
npx vite build
npx wrangler dev --config dist/m_hono_cf_vite/wrangler.json --port 53871 --inspector-port 0 \
  --var TRACE_LIFECYCLE:static > dev3.log 2>&1 &
curl -s http://127.0.0.1:53871/db ; curl -s http://127.0.0.1:53871/fetchout ; curl -s http://127.0.0.1:53871/boom/9
curl -s http://127.0.0.1:53871/sentinel
curl -s http://127.0.0.1:41207/__items
```

`dist/` is kept (3.3 MB) so step 3 runs without a rebuild.

## Expected

Recorded verdicts (all `works` except `client errors`, which is `not-run`: server-only Worker, no
browser bundle, `@sentry/hono/cloudflare` has no client-side entry).

- **errors** — thrown in `app.get('/boom/:id')`, captured with mechanism
  `auto.http.hono.context_error`, `handled: false`, sdk `sentry.javascript.hono`, transaction
  `GET /boom/:id`. Hono does not swallow it: still 500, span/transaction status `internal_error`.
- **route names** — `GET /users/:id`, `sentry.segment.name.source = "route"`,
  `http.route = "/users/:id"`, origin `auto.http.cloudflare`, op `http.server`.
- **isolation** — three concurrent `GET /iso/:tag` produce three events, each with only its own
  `probe_tag` and its own trace id matching its own `http.server` span.
- **incoming trace** — server span with `trace_id 11111111111111111111111111111111` and
  `parent_span_id 2222222222222222`.
- **outgoing fetch** — `http.client` span child of the server span, recorder sees
  `sentry-trace: <traceid>-<spanid>-1` and full baggage including `sentry-transaction=GET%20%2Ffetchout`.
  Name is `GET 127.0.0.1` under stream, `GET http://127.0.0.1:41207/__rec` under static.
- **db spans** — `db | SELECT id, name FROM users` as a child of the server span, ONLY through the
  Cloudflare Vite plugin build.
- **logs** — `Sentry.logger.info('hono-cf-log-line', ...)` arrives as a `log` item at level info with
  the trace id of the enclosing `http.server` span.

Recorded evidence lines:

```
--- errors + route name (stream lifecycle, plain wrangler dev) ---
{"type":"event","exception":"hono-cf-boom","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","transaction":"GET /boom/:id","trace_id":"b0464451d01a4584b97b0681f4ac0f29","span_id":"872c0da2edfc705d","req_url":"http://127.0.0.1:47212/boom/7","hasContextLine":false}
{"type":"span","items":[{"n":"http.server | GET /users/:id","route":"/users/:id","trace_id":"fbe060ef0a514c9d9af9e1173d22b6ec","span_id":"8f5bea001869ece5"}]}

--- route source, raw span attributes (stream) ---
"name": "GET /users/:id"
"sentry.origin": { "value": "auto.http.cloudflare" }
"sentry.op": { "value": "http.server" }
"sentry.segment.name.source": { "value": "route" }
"http.route": { "value": "/users/:id" }
"sentry.custom_span_name": { "value": "GET /users/:id" }
"sentry.sdk.name": { "value": "sentry.javascript.hono" }
"sentry.trace_lifecycle": { "value": "stream" }
"cloud.provider": { "value": "cloudflare" }

--- isolation: 3 concurrent GET /iso/:tag (stream) ---
{"type":"event","exception":"iso-bbb","tags":{"probe_tag":"bbb"},"transaction":"GET /iso/:tag","trace_id":"698cc854508b485aa98aae632fbf76d4","span_id":"a8767a4bfe35f380",...}
{"type":"event","exception":"iso-ccc","tags":{"probe_tag":"ccc"},"transaction":"GET /iso/:tag","trace_id":"7a9405a85d04474f950f4eb5f8807d43","span_id":"a7c2abad02fc488f",...}
{"type":"event","exception":"iso-aaa","tags":{"probe_tag":"aaa"},"transaction":"GET /iso/:tag","trace_id":"a211573628d84bf2924c2dc6fcf6d5c6","span_id":"b95ecd463b127f29",...}

--- incoming trace continuation (stream) ---
{"type":"span","items":[{"n":"http.server | GET /users/:id","route":"/users/:id","trace_id":"11111111111111111111111111111111","span_id":"b64bf6200f4c6a0b","parent_span_id":"2222222222222222"}]}

--- outgoing fetch (stream) ---
{"type":"span","items":[{"n":"http.client | GET 127.0.0.1","trace_id":"0a4f3286e7754be382dc3da12af401a5","span_id":"94383ea8005cc8d1","parent_span_id":"ba1e405ea9ae434b"},{"n":"http.server | GET /fetchout","route":"/fetchout","trace_id":"0a4f3286e7754be382dc3da12af401a5","span_id":"ba1e405ea9ae434b"}]}
recorder: [{"url":"/__rec?from=hono","sentryTrace":"0a4f3286e7754be382dc3da12af401a5-94383ea8005cc8d1-1","baggage":"sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=0a4f3286e7754be382dc3da12af401a5,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.021604387676193326,sentry-sample_rate=1"}]
```

## Observed on 2026-09-07

All seven capabilities reproduce; the eighth (`client errors`) stays `not-run` for the same reason.
Verbatim, trimmed:

```
--- errors + route name (stream lifecycle, plain wrangler dev on 47612) ---
{"type": "event", "exception": "hono-cf-boom", "mechanism": "auto.http.hono.context_error", "handled": false, "sdk": "sentry.javascript.hono", "transaction": "GET /boom/:id", "trace_id": "edced39361b4435a85bd449605674ae1", "span_id": "9a15a520166dbf9b", "req_url": "http://127.0.0.1:47612/boom/7", "hasContextLine": false}
{"type": "span", "items": [{"n": "http.server | GET /boom/:id", "route": "/boom/:id", "status": "error", "origin": "auto.http.cloudflare", "source": "route", "trace_id": "edced39361b4435a85bd449605674ae1", "span_id": "9a15a520166dbf9b"}]}
(HTTP status of GET /boom/7 was 500)

--- route source, raw span attributes (stream) ---
"name": "GET /users/:id"
"sentry.origin": {"value": "auto.http.cloudflare", "type": "string"}
"sentry.op": {"value": "http.server", "type": "string"}
"sentry.segment.name.source": {"value": "route", "type": "string"}
"http.route": {"value": "/users/:id", "type": "string"}
"sentry.custom_span_name": {"value": "GET /users/:id", "type": "string"}
"sentry.sdk.name": {"value": "sentry.javascript.hono", "type": "string"}
"sentry.trace_lifecycle": {"value": "stream", "type": "string"}
"cloud.provider": {"value": "cloudflare", "type": "string"}

--- isolation: 3 concurrent GET /iso/:tag (stream) ---
{"type": "event", "exception": "iso-bbb", "tags": {"probe_tag": "bbb"}, "transaction": "GET /iso/:tag", "trace_id": "db80d7cfa5284196852fe82a4bb37f8a", "span_id": "ae45273a29eb054b", ...}
{"type": "event", "exception": "iso-ccc", "tags": {"probe_tag": "ccc"}, "transaction": "GET /iso/:tag", "trace_id": "7880baa58b5146aaa25b2403c78ef064", "span_id": "a9f2a42d41d70c2e", ...}
{"type": "event", "exception": "iso-aaa", "tags": {"probe_tag": "aaa"}, "transaction": "GET /iso/:tag", "trace_id": "40834c5eb8554808b58ccbd150cdcf12", "span_id": "99bb754dfb1da25d", ...}
{"type": "span", "items": [{"n": "http.server | GET /iso/:tag", "route": "/iso/:tag", "trace_id": "db80d7cfa5284196852fe82a4bb37f8a", "span_id": "ae45273a29eb054b"}]}
{"type": "span", "items": [{"n": "http.server | GET /iso/:tag", "route": "/iso/:tag", "trace_id": "7880baa58b5146aaa25b2403c78ef064", "span_id": "a9f2a42d41d70c2e"}]}
{"type": "span", "items": [{"n": "http.server | GET /iso/:tag", "route": "/iso/:tag", "trace_id": "40834c5eb8554808b58ccbd150cdcf12", "span_id": "99bb754dfb1da25d"}]}

--- incoming trace continuation (stream) ---
{"type": "span", "items": [{"n": "http.server | GET /users/:id", "route": "/users/:id", "status": "ok", "origin": "auto.http.cloudflare", "source": "route", "trace_id": "11111111111111111111111111111111", "span_id": "835ff6827c3a4f99", "parent_span_id": "2222222222222222"}]}

--- outgoing fetch (stream) ---
{"type": "span", "items": [{"n": "http.client | GET 127.0.0.1", "status": "ok", "origin": "auto.http.fetch", "trace_id": "3aa67398fb444290ad925735da09768c", "span_id": "89d0cf9dc63bc2a6", "parent_span_id": "a2ccfdc1cc26141e"}, {"n": "http.server | GET /fetchout", "route": "/fetchout", "status": "ok", "origin": "auto.http.cloudflare", "source": "route", "trace_id": "3aa67398fb444290ad925735da09768c", "span_id": "a2ccfdc1cc26141e"}]}
recorder: [{"url":"/__rec?from=hono","sentryTrace":"3aa67398fb444290ad925735da09768c-89d0cf9dc63bc2a6-1","baggage":"sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=3aa67398fb444290ad925735da09768c,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.6093634396846316,sentry-sample_rate=1"}]

--- logs (stream) ---
{"type": "log", "items": ["info: hono-cf-log-line"], "trace_ids": ["ac3dfd90506240a680e063c77b32c997"]}
{"type": "span", "items": [{"n": "http.server | GET /log", "route": "/log", "status": "ok", "origin": "auto.http.cloudflare", "source": "route", "trace_id": "ac3dfd90506240a680e063c77b32c997", "span_id": "b584c5a0a00c86ae"}]}

--- db negative control: plain wrangler dev, GET /db returns rows but emits no db span ---
{"type": "span", "items": [{"n": "http.server | GET /db", "route": "/db", "status": "ok", "origin": "auto.http.cloudflare", "source": "route", "trace_id": "4d42ca166c804d0db9a0b9266476540b", "span_id": "b439f1f744e703e2"}]}

--- db spans + nesting: static lifecycle, Vite plugin build on 53871 ---
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "bff73e35df934fe780552acfe598fa91", "sdk": "sentry.javascript.hono", "spans": ["db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /fetchout", "op": "http.server", "source": "route", "status": "ok", "trace_id": "2b4b55ce9f774d3385e76254c35fe9b8", "sdk": "sentry.javascript.hono", "spans": ["http.client GET http://127.0.0.1:41207/__rec"]}
{"type": "transaction", "name": "GET /boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "a40b86fdc7b24c278743cafebc3a312b", "sdk": "sentry.javascript.hono", "spans": []}
```

Matches the recorded verdict on every capability, including the recorded side notes: no
`middleware.hono` spans appear in the static transactions' `spans[]`, and the db span shows up only
in the Vite-built worker.

Differences from the record, none of them behavioral:

- Ports differ (sink 41207, plain dev 47612, vite dev 53871 vs. the recorded 47211/47212/53871);
  47212 and 41208 were already bound by other processes on this machine.
- The recorded run does not say how the lifecycle was switched for step 3. This rebuild reads
  `env.TRACE_LIFECYCLE` in the `sentry()` options callback and passes
  `--var TRACE_LIFECYCLE:static` to the Vite-config `wrangler dev`.
