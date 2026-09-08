# M-astro-cf

Astro 7.3.1 with `@astrojs/cloudflare` 14.3.0 on Cloudflare Workers (wrangler 4.129.0, workerd
1.20260903.1, `compatibility_date` 2026-05-01, `nodejs_compat`), `@sentry/astro` +
`@sentry/cloudflare` 10.67.0 from the develop tarballs (`6f2da7483d`).

## What it reproduces

Astro's Cloudflare adapter build runs under `@sentry/cloudflare`'s `withSentry` and all seven server
capabilities work: thrown route errors are captured with mechanism `auto.middleware.astro`,
parameterized routes are named `GET /api/users/[id]` with `http.route` and source `route`,
concurrent requests keep separate isolation scopes and trace ids, an incoming
`sentry-trace`/`baggage` pair is continued, an outgoing `fetch` gets an `http.client` child span plus
both propagation headers, a module-scope `mysql` connection produces a `db` span, and
`Sentry.logger.info` arrives as a log envelope. Both halves of the wiring are load-bearing and
neither works alone: `integrations: [sentry()]` in `astro.config.mjs` installs the request middleware
(error capture, route names) and the build-time channel injection used for the db span, while
`withSentry` in `sentry.server.config.ts` (referenced as `main` from `wrangler.jsonc`) supplies the
client, isolation scope, transport, logs and fetch instrumentation. No `@cloudflare/vite-plugin` or
`sentryCloudflareVitePlugin` of your own is needed; the Astro integration's own Vite plugin emits
`globalThis.__SENTRY_ORCHESTRION__.bundler` into `dist/server/entry.mjs`.

Build-order trap: the user-facing `wrangler.jsonc` must not point `main` at a `dist` path that does
not exist yet. `@astrojs/cloudflare` v14 runs `@cloudflare/vite-plugin` during `astro build` and hard
fails with "The provided Wrangler config main field ... doesn't point to an existing file".

## Install

```sh
cd $REPRO/cells/M-astro-cf
npm install
```

`package.json` pins the develop tarballs by relative path (`../../_toolbox/pack/sentry-*-10.67.0.tgz`).
A fresh install from scratch is:

```sh
P=$REPRO/_toolbox/pack
npm install astro@7 @astrojs/cloudflare@14 wrangler@4 mysql \
  $P/sentry-astro-10.67.0.tgz $P/sentry-cloudflare-10.67.0.tgz $P/sentry-core-10.67.0.tgz \
  $P/sentry-node-10.67.0.tgz $P/sentry-browser-10.67.0.tgz $P/sentry-browser-utils-10.67.0.tgz \
  $P/sentry-replay-10.67.0.tgz $P/sentry-replay-canvas-10.67.0.tgz $P/sentry-feedback-10.67.0.tgz \
  $P/sentry-opentelemetry-10.67.0.tgz $P/sentry-server-utils-10.67.0.tgz \
  $P/sentry-server-runtime-injection-10.67.0.tgz $P/sentry-bundler-plugins-10.67.0.tgz
```

## Run

Requires MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users`).

```sh
cd $REPRO/cells/M-astro-cf

# sinks - plain node, so they never carry a sampled-out sentry-trace
PORT=37411 node sink2.mjs > sink.log 2>&1 &        # envelope sink, /__items and /__raw
PORT=37412 node recorder.mjs > rec.log 2>&1 &      # outgoing-header recorder

# build and run
npx astro build
npx wrangler dev --config dist/server/wrangler.json --port 37413 --inspector-port 0 > wrangler.log 2>&1 &
# wait for: [wrangler:info] Ready on http://localhost:37413

# probes
curl -s http://127.0.0.1:37413/api/users/42
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:37413/api/error
curl -s 'http://127.0.0.1:37413/api/iso?tag=alpha' & curl -s 'http://127.0.0.1:37413/api/iso?tag=beta' & curl -s 'http://127.0.0.1:37413/api/iso?tag=gamma' & wait
TID=aaaabbbbccccddddeeeeffff00001111; SP=1122334455667788
curl -s -H "sentry-trace: $TID-$SP-1" -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" http://127.0.0.1:37413/api/hello
curl -s http://127.0.0.1:37413/api/fetchout
curl -s http://127.0.0.1:37413/api/log
curl -s http://127.0.0.1:37413/api/db
curl -s http://127.0.0.1:37413/api/sentinel     # sentinel: wait until it shows up in the sink
sleep 7                                          # logs are flushed on a timer
curl -s http://127.0.0.1:37411/__items; curl -s http://127.0.0.1:37411/__raw; curl -s http://127.0.0.1:37412/__seen

# static lifecycle: same build, restart wrangler with the var overridden
curl -s -X DELETE http://127.0.0.1:37411/__items
npx wrangler dev --config dist/server/wrangler.json --port 37413 --inspector-port 0 --var TRACE_LIFECYCLE:static > wrangler-static.log 2>&1 &

# control A: delete `integrations: [sentry()]` from astro.config.mjs, rebuild, rerun
# control B: delete "main" from wrangler.jsonc, rebuild, rerun
```

Stop the servers by the pids you captured when you started them.

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | works |
| db spans | works |
| logs | works |
| client errors | not-run (server runtime only, no `sentry.client.config.js`) |

Recorded evidence:

```
{"type":"span","trace_id":"aa1c56459744410988e87188e0771afa","items":[{"n":"http.server GET /api/users/[id]","trace_id":"aa1c56459744410988e87188e0771afa","http_route":"/api/users/[id]"}]}
{"type":"event","exception":"astro-cf route boom","mechanism":"auto.middleware.astro","handled":false,"sdk":"sentry.javascript.cloudflare","trace_id":"909373430f0143e2b37612ca861478ee","transaction":"GET /api/error","request_url":"http://127.0.0.1:37413/api/error","hasContextLine":false}

raw attributes of the /api/users/[id] span:
  "sentry.origin": "auto.http.astro", "sentry.op": "http.server",
  "sentry.segment.name.source": "route", "sentry.segment.name": "GET /api/users/[id]",
  "http.route": "/api/users/[id]", "url.path": "/api/users/42",
  "sentry.sdk.name": "sentry.javascript.cloudflare", "cloud.provider": "cloudflare",
  "sentry.sdk.integrations": [Dedupe, EventFilters, FunctionToString, ConversationId, LinkedErrors, Fetch, HttpServer, RequestData, Console, SpanStreaming]

# isolation, 3 concurrent requests
{"type":"event","exception":"iso beta","tags":{"probe_tag":"beta"},"trace_id":"2377bd6e900a469abf2c316c877b1a9b","transaction":"GET /api/iso"}
{"type":"event","exception":"iso alpha","tags":{"probe_tag":"alpha"},"trace_id":"37826c9b03444f4ca1b511889323d267","transaction":"GET /api/iso"}
{"type":"event","exception":"iso gamma","tags":{"probe_tag":"gamma"},"trace_id":"f782db514906476e82de323b2af1ce57","transaction":"GET /api/iso"}

# incoming trace / outgoing fetch / logs / db, stream
{"type":"span","trace_id":"aaaabbbbccccddddeeeeffff00001111","items":[{"n":"http.server GET /api/hello","parent":"1122334455667788","http_route":"/api/hello"}]}
{"type":"span","trace_id":"06509e0f37ea4669a7410fbde7eb02ba","items":[{"n":"http.client GET 127.0.0.1","parent":"9d965d4beffacbaf"},{"n":"http.server GET /api/fetchout","http_route":"/api/fetchout"}]}
{"type":"log","items":["info: hello from astro on cloudflare"]}
{"type":"span","trace_id":"663089f01d4148cca48d7ed3f44e2af6","items":[{"n":"db SELECT users","parent":"b6a89ab470b37d9d","db":"mysql"},{"n":"http.server GET /api/db","http_route":"/api/db"}]}
recorder saw: [{"url":"/rec","sentry-trace":"06509e0f37ea4669a7410fbde7eb02ba-95c112fbbf9e9f47-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=06509e0f37ea4669a7410fbde7eb02ba,sentry-org_id=1,sentry-transaction=GET%20%2Fapi%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.8176230722746061,sentry-sample_rate=1"}]

# traceLifecycle: 'static'
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"route","status":"internal_error","spans":[]}
```

The record also notes the emitted entry: `var worker_entry_default = sentry_server_config_default ?? {}`
and a present `globalThis.__SENTRY_ORCHESTRION__.bundler`.

## Observed on 2026-09-07

Ran once, astro 7.3.1, `@astrojs/cloudflare` 14.3.0, wrangler 4.129.0, workerd 1.20260903.1,
`mysql` 2.18.1, node 26.5.0. Files: `observed-stream.json`, `observed-static.json`,
`observed-recorder.json`.

All seven server verdicts match the record. `client errors` was not run here either, for the same
reason: no `sentry.client.config.js` and no browser was driven.

Stream lifecycle, sink `/__items`:

```
{"type": "span", "trace_id": "43bc7d34060a4b03a4c4a3e026e9dc7e", "items": [{"n": "http.server GET /api/users/[id]", "trace_id": "43bc7d34060a4b03a4c4a3e026e9dc7e", "http_route": "/api/users/[id]"}]}
{"type": "event", "exception": "astro-cf route boom", "mechanism": "auto.middleware.astro", "handled": false, "sdk": "sentry.javascript.cloudflare", "trace_id": "556623fd782f4e99b0260b1b8dc9543a", "transaction": "GET /api/error", "request_url": "http://127.0.0.1:37413/api/error", "hasContextLine": false}

# isolation, 3 concurrent requests
{"type": "event", "exception": "iso alpha", "tags": {"probe_tag": "alpha"}, "trace_id": "18d625eecd0446a3a8b41a852f579e00", "transaction": "GET /api/iso"}
{"type": "event", "exception": "iso gamma", "tags": {"probe_tag": "gamma"}, "trace_id": "dbf24eca4be94683bbd9a4ab23b92f28", "transaction": "GET /api/iso"}
{"type": "event", "exception": "iso beta", "tags": {"probe_tag": "beta"}, "trace_id": "d08dec6e97bf42258a1880db1d8115d3", "transaction": "GET /api/iso"}

# incoming trace / outgoing fetch / logs / db
{"type": "span", "trace_id": "aaaabbbbccccddddeeeeffff00001111", "items": [{"n": "http.server GET /api/hello", "parent": "1122334455667788", "http_route": "/api/hello"}]}
{"type": "span", "trace_id": "24dc101c5df84fa1a565f0427f0d1a42", "items": [{"n": "http.client GET 127.0.0.1", "parent": "9ad08abb17e7f925"}, {"n": "http.server GET /api/fetchout", "http_route": "/api/fetchout"}]}
{"type": "log", "items": ["info: hello from astro on cloudflare"]}
{"type": "span", "trace_id": "0281aa62948f4291ae118d1ff8e2454a", "items": [{"n": "db SELECT users", "parent": "90a6b54497765bf1"}, {"n": "http.server GET /api/db", "http_route": "/api/db"}]}

# recorder /__seen
[{"url":"/rec","sentry-trace":"24dc101c5df84fa1a565f0427f0d1a42-ab00780dd671da4e-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=24dc101c5df84fa1a565f0427f0d1a42,sentry-transaction=GET%20%2Fapi%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.6622765672025648,sentry-sample_rate=1"}]
```

Raw attributes of the `/api/users/[id]` span, and of the db span:

```
"sentry.origin": "auto.http.astro", "sentry.op": "http.server",
"sentry.segment.name.source": "route", "sentry.segment.name": "GET /api/users/[id]",
"http.route": "/api/users/[id]", "url.path": "/api/users/42",
"sentry.sdk.name": "sentry.javascript.cloudflare", "cloud.provider": "cloudflare",
"sentry.sdk.integrations": ["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"]

"sentry.origin": "auto.db.mysql", "sentry.op": "db", "db.system.name": "mysql",
"db.query.text": "SELECT id, name FROM users", "db.query.summary": "SELECT users",
"server.address": "127.0.0.1", "server.port": 3307
```

Static lifecycle, same build, `--var TRACE_LIFECYCLE:static`:

```
{"type": "transaction", "name": "GET /api/users/[id]", "op": "http.server", "source": "route", "status": "ok", "route": "/api/users/[id]", "spans": []}
{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "route", "status": "internal_error", "route": "/api/error", "spans": []}
{"type": "transaction", "name": "GET /api/fetchout", "op": "http.server", "source": "route", "status": "ok", "route": "/api/fetchout", "spans": ["http.client GET http://127.0.0.1:37412/rec"]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "route", "status": "ok", "route": "/api/db", "spans": ["db SELECT id, name FROM users"]}
```

Both build-shape notes reproduced: `dist/server/entry.mjs` contains
`var worker_entry_default = sentry_server_config_default ?? {}` and the
`globalThis.__SENTRY_ORCHESTRION__` bundler set, and `dist/server/chunks/db_*.mjs` contains
`orchestrion:mysql:query`.

### Differences from the record

Nothing that changes a verdict. Two cosmetic deltas:

- The db span's attribute is `db.system.name: "mysql"` on this build; the record's evidence line
  rendered it as `"db":"mysql"` because that sink read `db.system`. The span itself is identical
  (`sentry.origin: auto.db.mysql`, op `db`, `db.query.summary: "SELECT users"`).
- The outgoing baggage carries no `sentry-org_id=1` here (the record's DSN had an org id); every
  other baggage key matches.

The controls the record describes (dropping `integrations: [sentry()]`, dropping `main`) were not
rerun; this was a single confirmation pass of the documented shape.
