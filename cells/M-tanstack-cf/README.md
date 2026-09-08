# M-tanstack-cf

TanStack Start (React) v1.136 with file-based routing + `@sentry/tanstackstart-react` and
`@sentry/cloudflare` 10.67.0 (develop / v11 line) running on Cloudflare Workers
(workerd via wrangler 4.x local dev, `nodejs_compat`, `compatibility_date` 2026-05-01).

## What it reproduces

A TanStack Start app whose server entry is a Cloudflare Worker: `src/server.ts` wraps the framework's
`@tanstack/react-start/server-entry` in `wrapFetchWithSentry(...)` and then in
`Sentry.withSentry(...)` from `@sentry/cloudflare`, while `src/start.ts` registers
`sentryGlobalRequestMiddleware` / `sentryGlobalFunctionMiddleware` as the first global middlewares.
Every probed capability works: errors thrown from a `createFileRoute('/users/$id').server.handlers.GET`
handler arrive unhandled with mechanism `auto.middleware.tanstackstart.request` and the request still
returns HTTP 500, transactions are named by the parametrized route (`GET /users/$id`, `source: route`,
`http.route`), three concurrent requests keep their own scope and trace, an incoming `sentry-trace`
header is continued, an outgoing `fetch` gets an `http.client` child span plus `sentry-trace`/`baggage`
headers, a module-scope `mysql` pool query produces a `db` child span, and `Sentry.logger.info` arrives
as a `log` item on the request's trace. The load-bearing piece the docs omit is `sentryTanstackStart()`
in `vite.config.ts`: it defines `__SENTRY_ROUTE_PATTERNS__` (read by `wrapFetchWithSentry`) and runs
`sentryOrchestrionPlugin` for the db/library channels, and it skips the orchestrion plugin when
`NODE_ENV === 'development'`, so only `vite build` + `wrangler dev` produces db spans on this stack.

## Install

```
cd $REPRO/cells/M-tanstack-cf
npm install --no-audit --no-fund
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz ../../_toolbox/pack/sentry-tanstackstart-react-10.67.0.tgz \
  ../../_toolbox/pack/sentry-browser-10.67.0.tgz ../../_toolbox/pack/sentry-browser-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-node-10.67.0.tgz \
  ../../_toolbox/pack/sentry-react-10.67.0.tgz ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz ../../_toolbox/pack/sentry-replay-10.67.0.tgz \
  ../../_toolbox/pack/sentry-replay-canvas-10.67.0.tgz ../../_toolbox/pack/sentry-feedback-10.67.0.tgz
```

(All `@sentry/*` tarballs must be on one command line so npm resolves their `10.67.0` transitive pins.)

Needs MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`) for
`/api/probe-db`.

## Run

```
# sinks
PORT=33517 node sink.mjs     > sink.log     2>&1 &   # envelopes, GET/DELETE /__items
PORT=33518 node recorder.mjs > recorder.log 2>&1 &   # header echo, GET /__hits

# build + serve
NODE_ENV=production npx vite build
npx wrangler dev --config dist/server/wrangler.json --port 33519 --inspector-port 0 > wrangler.log 2>&1 &
# readiness: "[wrangler:info] Ready on http://localhost:33519"

# probes
B=http://127.0.0.1:33519
curl -s $B/users/42                                              # route name
curl -s -o /dev/null -w '%{http_code}\n' $B/users/boom           # error, returns 500
(curl -s $B/iso/alpha & curl -s $B/iso/bravo & curl -s $B/iso/charlie & wait)   # isolation
curl -s -H 'sentry-trace: aaaabbbbccccddddeeeeffff00001111-1122334455667788-1' \
        -H 'baggage: sentry-environment=incoming,sentry-public_key=public,sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-sample_rate=1,sentry-sampled=true' \
        $B/users/77                                              # incoming trace
curl -s $B/api/probe-fetch                                       # outgoing fetch
curl -s $B/api/probe-db                                          # mysql db span
curl -s $B/api/probe-log                                         # logs (wait 8s)
curl -s $B/api/sentinel                                          # sentinel, poll until it lands

curl -s http://127.0.0.1:33517/__items
curl -s http://127.0.0.1:33518/__hits

# stream cross-check: set traceLifecycle to 'stream' in src/server.ts, rerun `vite build`
# (wrangler dev picks up the rebuilt dist/server bundle by itself)
```

## Expected (recorded verdict)

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | works |
| logs | works |

Recorded evidence lines:

```
### errors + route names (traceLifecycle: 'static')
{"type":"transaction","name":"GET /users/$id","op":"http.server","source":"route","status":"ok","trace_id":"c170ba72671d4820828c488bd615b308","http_route":"/users/$id","spans":[]}
{"type":"event","exception":"TanStackCF Route Handler Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"sdk":"sentry.javascript.cloudflare","transaction":"GET /users/$id","trace_id":"efa7291e3c7f4c95ad0cac29a4b8ad4a","hasContextLine":false}
{"type":"transaction","name":"GET /users/$id","op":"http.server","source":"route","status":"internal_error","trace_id":"efa7291e3c7f4c95ad0cac29a4b8ad4a","http_route":"/users/$id","spans":[]}
(curl of /users/boom returned HTTP 500)

### isolation - 3 concurrent requests, static
{"type":"event","exception":"iso error alpha","mechanism":"generic","handled":true,"transaction":"GET /iso/$tag","tags":{"probe_tag":"alpha"},"trace_id":"0d48d885a5014d06a836cf590044e206"}
{"type":"transaction","name":"GET /iso/$tag","source":"route","trace_id":"0d48d885a5014d06a836cf590044e206","http_route":"/iso/$tag","tags":{"probe_tag":"alpha"},"spans":[]}
{"type":"event","exception":"iso error bravo","mechanism":"generic","handled":true,"transaction":"GET /iso/$tag","tags":{"probe_tag":"bravo"},"trace_id":"bfadcc15ead046d3875aab56c1c5cbc8"}
{"type":"transaction","name":"GET /iso/$tag","source":"route","trace_id":"bfadcc15ead046d3875aab56c1c5cbc8","http_route":"/iso/$tag","tags":{"probe_tag":"bravo"},"spans":[]}
{"type":"event","exception":"iso error charlie","mechanism":"generic","handled":true,"transaction":"GET /iso/$tag","tags":{"probe_tag":"charlie"},"trace_id":"3ca5fa81f8af4697befd88ba8d3d08cf"}
{"type":"transaction","name":"GET /iso/$tag","source":"route","trace_id":"3ca5fa81f8af4697befd88ba8d3d08cf","http_route":"/iso/$tag","tags":{"probe_tag":"charlie"},"spans":[]}

### incoming trace (sent sentry-trace: aaaabbbbccccddddeeeeffff00001111-1122334455667788-1)
{"type":"transaction","name":"GET /users/$id","op":"http.server","source":"route","status":"ok","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1122334455667788","http_route":"/users/$id","spans":[]}

### outgoing fetch
{"type":"transaction","name":"GET /api/probe-fetch","op":"http.server","source":"route","status":"ok","trace_id":"1618d771012e44be8077b306c7408659","http_route":"/api/probe-fetch","spans":["http.client GET http://127.0.0.1:33518/rec"]}
recorder: [{"url":"/rec","sentry-trace":"1618d771012e44be8077b306c7408659-b87a74f6c91b675a-1","baggage":"sentry-environment=probe,sentry-release=m-tanstack-cf,sentry-public_key=public,sentry-trace_id=1618d771012e44be8077b306c7408659,sentry-transaction=GET%20%2Fapi%2Fprobe-fetch,sentry-sampled=true,sentry-sample_rand=0.49281264132575187,sentry-sample_rate=1"}]

### db spans (module-scope mysql pool, MariaDB 127.0.0.1:3307)
HTTP body: [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]

### logs
`Sentry.logger.info('tanstack cf probe log', ...)` arrived as a `log` item `info: tanstack cf probe log`
carrying the same trace_id (502d6782cfa04424b727e0df8a0e4b77) as the `GET /api/probe-log` transaction.

### stream lifecycle cross-check
span `http.server GET /users/$id` with `sentry.segment.name.source = route`;
low-cardinality child names `db SELECT users` and `http.client GET 127.0.0.1`.
```

## Observed on 2026-09-07

All seven capabilities reproduce. Verbatim trimmed sink output:

```
# errors + route names -- works (traceLifecycle: 'static')
$ curl -s http://127.0.0.1:33519/users/42            -> {"ok":true,"id":"42"}
$ curl -s -o /dev/null -w '%{http_code}' .../users/boom  -> 500
{"type":"transaction","name":"GET /users/$id","op":"http.server","source":"route","status":"ok","trace_id":"686146ceacac4e9ab4625d9fccef954e","sdk":"sentry.javascript.cloudflare","http_route":"/users/$id","spans":[]}
{"type":"event","exception":"Error: TanStackCF Route Handler Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"transaction":"GET /users/$id","trace_id":"dc101214823244d3aed67599fc4c987f"}
{"type":"transaction","name":"GET /users/$id","op":"http.server","source":"route","status":"internal_error","trace_id":"dc101214823244d3aed67599fc4c987f","sdk":"sentry.javascript.cloudflare","http_route":"/users/$id","spans":[]}

# isolation -- works: 3 concurrent requests, each event has only its own tag and its own trace id
{"type":"event","exception":"Error: iso error alpha","mechanism":"generic","handled":true,"transaction":"GET /iso/$tag","tags":{"probe_tag":"alpha"},"trace_id":"2db271270c0e4880afa1f032a687c82b"}
{"type":"transaction","name":"GET /iso/$tag","source":"route","trace_id":"2db271270c0e4880afa1f032a687c82b","http_route":"/iso/$tag","tags":{"probe_tag":"alpha"},"spans":[]}
{"type":"event","exception":"Error: iso error bravo","mechanism":"generic","handled":true,"transaction":"GET /iso/$tag","tags":{"probe_tag":"bravo"},"trace_id":"1aac6011e1c84d77a82624ff4055fd46"}
{"type":"transaction","name":"GET /iso/$tag","source":"route","trace_id":"1aac6011e1c84d77a82624ff4055fd46","http_route":"/iso/$tag","tags":{"probe_tag":"bravo"},"spans":[]}
{"type":"event","exception":"Error: iso error charlie","mechanism":"generic","handled":true,"transaction":"GET /iso/$tag","tags":{"probe_tag":"charlie"},"trace_id":"696d5aa4250242baaef30c54374e9ac4"}
{"type":"transaction","name":"GET /iso/$tag","source":"route","trace_id":"696d5aa4250242baaef30c54374e9ac4","http_route":"/iso/$tag","tags":{"probe_tag":"charlie"},"spans":[]}

# incoming trace -- works
{"type":"transaction","name":"GET /users/$id","op":"http.server","source":"route","status":"ok","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1122334455667788","http_route":"/users/$id","spans":[]}

# outgoing fetch -- works
{"type":"transaction","name":"GET /api/probe-fetch","op":"http.server","source":"route","status":"ok","trace_id":"b5d11d9b2d4543e39ae6562326503bec","parent_span_id":null,"http_route":"/api/probe-fetch","spans":["http.client GET http://127.0.0.1:33518/rec"]}
recorder: [{"url":"/rec","sentry-trace":"b5d11d9b2d4543e39ae6562326503bec-88f18c0107446c9b-1","baggage":"sentry-environment=probe,sentry-release=m-tanstack-cf,sentry-public_key=public,sentry-trace_id=b5d11d9b2d4543e39ae6562326503bec,sentry-transaction=GET%20%2Fapi%2Fprobe-fetch,sentry-sampled=true,sentry-sample_rand=0.7367838659097561,sentry-sample_rate=1"}]

# db spans -- works
$ curl -s http://127.0.0.1:33519/api/probe-db  -> [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
{"type":"transaction","name":"GET /api/probe-db","op":"http.server","source":"route","status":"ok","trace_id":"715516c2bff449f0896bf35933958bab","parent_span_id":null,"http_route":"/api/probe-db","spans":["db SELECT id, name FROM users"]}

# logs -- works
{"type":"transaction","name":"GET /api/probe-log","op":"http.server","source":"route","status":"ok","trace_id":"00c50e45390e413b836051f8c01dded5","parent_span_id":null,"http_route":"/api/probe-log","spans":[]}
{"type":"log","items":["info: tanstack cf probe log"],"trace_id":"00c50e45390e413b836051f8c01dded5"}

# stream lifecycle cross-check -- holds, same low-cardinality names as recorded
{"type":"span","items":["http.server GET /users/$id"],"raw":[{"name":"GET /users/$id","source":"route","http_route":"/users/$id"}]}
{"type":"event","exception":"Error: TanStackCF Route Handler Error","mechanism":"auto.middleware.tanstackstart.request","handled":false,"transaction":"GET /users/$id"}
{"type":"span","items":["http.client GET 127.0.0.1","http.server GET /api/probe-fetch"]}
{"type":"span","items":["db SELECT users","http.server GET /api/probe-db"]}
```

Differences from the record, none of them changing a verdict:

- Trace, span and sample ids differ per run, as expected.
- The record's evidence writes the exception value alone (`"TanStackCF Route Handler Error"`); this
  sink prints `"Error: TanStackCF Route Handler Error"` (`type: value`). Same event.
- `@tanstack/react-start` is pinned to `~1.136.0` (resolves to 1.136.18) instead of the record's
  `^1.136`, which today would install 1.139.x and no longer be the recorded framework version.
- `src/router.tsx` must export `getRouter`, not `createRouter`: `hydrateStart` imports `getRouter`
  from `#tanstack-router-entry` and the build fails otherwise. The record did not mention it.
- Nothing else. `wrangler` resolved to 4.129.0 with workerd 1.20260903.1, exactly the recorded pair.

## Layout

- `sink.mjs` — the toolbox envelope sink, extended to keep `http.route` and `tags` on transactions,
  `trace_id` on log items, and `source`/`http_route` on stream spans.
- `recorder.mjs` — echoes `sentry-trace` / `baggage` of incoming requests, dump at `/__hits`.
- `src/server.ts` — `Sentry.withSentry(config, wrapFetchWithSentry(handler))` over
  `@tanstack/react-start/server-entry`; this file holds `traceLifecycle`.
- `src/start.ts` — `createStart` with `sentryGlobalRequestMiddleware` / `sentryGlobalFunctionMiddleware`.
- `src/client.tsx` / `src/instrument.client.ts` — client entry, `Sentry.init` from `@sentry/browser`.
- `src/db.ts` — module-scope `mysql` pool on 127.0.0.1:3307.
- `src/routes/` — `users.$id.tsx` (route name + thrown error on `/users/boom`), `iso.$tag.tsx`
  (isolation), `api.probe-fetch.tsx`, `api.probe-db.tsx`, `api.probe-log.tsx`, `api.sentinel.tsx`.
- `vite.config.ts` — `cloudflare()` first, then `tanstackStart()`, then
  `sentryTanstackStart({ sourcemaps: { disable: true } })`, then `viteReact()`.
- `dist/` — the build (4 MB) from the run above; `NODE_ENV=production npx vite build` regenerates it.
