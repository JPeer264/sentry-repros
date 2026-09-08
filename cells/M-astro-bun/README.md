# M-astro-bun

Astro 7.3.1 with the `@astrojs/node` standalone adapter, `@sentry/astro` 10.67.0 (develop, `6f2da7483d`),
served by `bun` from the Node-adapter build output `dist/server/entry.mjs`.

## What it reproduces

Astro's Node standalone build runs on bun unchanged, and everything the `@sentry/astro` request
middleware does itself keeps working there: thrown route errors, `[id]`-style route names,
per-request isolation scopes, incoming `sentry-trace`/`baggage` continuation and logs. What does not
work on bun is everything that depends on the Node runtime hooks under the middleware: an outgoing
`fetch` from a route handler produces no `http.client` span and sends no trace headers, and a
`mysql2` query produces no `db` span even though the integration's build-time channel injection
demonstrably landed in the built chunk (`dist/server/chunks/db_*.mjs` contains
`tr_ch_apm_tracingChannel("orchestrion:mysql2:query")`). Two setup details are load-bearing:
`@sentry/bundler-plugins` must be the develop tarball (the npm-published 10.67.0 imports
`ServerRuntimeClient` from `@sentry/core`, which develop moved to `@sentry/core/server`, and
`astro build` dies before it starts), and `bun --preload ./sentry.server.config.mjs` is mandatory
because the integration injects the server init with `injectScript('page-ssr', …)`, which after a
build lands in exactly one chunk, the `index.astro` page chunk, so an app whose first traffic hits an
API route would run uninstrumented.

## Install

```sh
cd $REPRO/cells/M-astro-bun
npm install
```

`package.json` already pins the develop tarballs by relative path
(`../../_toolbox/pack/sentry-*-10.67.0.tgz`), including `sentry-bundler-plugins-10.67.0.tgz`.
A fresh install from scratch is:

```sh
P=$REPRO/_toolbox/pack
npm install astro@latest @astrojs/node@latest mysql2@3.19.1
npm install $P/sentry-astro-10.67.0.tgz $P/sentry-node-10.67.0.tgz $P/sentry-core-10.67.0.tgz \
            $P/sentry-browser-10.67.0.tgz $P/sentry-server-utils-10.67.0.tgz \
            $P/sentry-server-runtime-injection-10.67.0.tgz $P/sentry-opentelemetry-10.67.0.tgz \
            $P/sentry-bundler-plugins-10.67.0.tgz
```

## Run

Requires MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users`).

```sh
cd $REPRO/cells/M-astro-bun

# sinks - plain node, so they never carry a sampled-out sentry-trace
node sink2.mjs > sink.log 2>&1 &        # envelope sink on 41501, keeps trace ids / tags / http.route
node recorder.mjs > rec.log 2>&1 &      # outgoing-header recorder on 41502

# build, then run the build output on bun
npx astro build
LIFECYCLE=static PORT=52341 HOST=127.0.0.1 bun --preload ./sentry.server.config.mjs dist/server/entry.mjs > app.log 2>&1 &

# drive it from curl, never from a Sentry-initialised process
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:52341/boom
curl -s http://127.0.0.1:52341/users/42
curl -s "http://127.0.0.1:52341/tagged?t=alpha" & curl -s "http://127.0.0.1:52341/tagged?t=beta" & curl -s "http://127.0.0.1:52341/tagged?t=gamma" & wait
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1111111111111111-1" \
        -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" \
        http://127.0.0.1:52341/users/77
curl -s http://127.0.0.1:52341/fetchout
curl -s http://127.0.0.1:52341/db
curl -s http://127.0.0.1:52341/log
curl -s "http://127.0.0.1:52341/sentinel?n=9"     # sentinel: captureMessage + flush
sleep 8 && curl -s http://127.0.0.1:41501/__items && curl -s http://127.0.0.1:41502/__seen

# node control run, same dist
curl -s -X DELETE http://127.0.0.1:41501/__items; curl -s -X DELETE http://127.0.0.1:41502/__seen
LIFECYCLE=static PORT=52341 HOST=127.0.0.1 node --import ./sentry.server.config.mjs dist/server/entry.mjs > app-node.log 2>&1 &
curl -s http://127.0.0.1:52341/fetchout; curl -s http://127.0.0.1:52341/db; curl -s "http://127.0.0.1:52341/sentinel?n=10"
```

Stop the servers by the pid you captured when you started them.

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** |
| db spans | **broken** |
| logs | works |

Recorded evidence (bun 1.4.0, `traceLifecycle: 'static'`, sink `/__items`):

```
{"type":"event","exception":"astro-bun-route-boom","mechanism":"auto.middleware.astro","handled":false,"sdk":"sentry.javascript.astro","transaction":"GET /boom","trace_id":"6391f6673e6f4c518495c0050b968079","runtime":"node","hasContextLine":true,"reqUrl":"http://127.0.0.1:52341/boom"}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","route":"/boom","spans":[]}
{"type":"transaction","name":"GET /users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"44dde18fa2cf41bda6bc43ce61dc6b9c","route":"/users/[id]","spans":[]}

# isolation - three concurrent requests
{"type":"event","exception":"iso-alpha","tags":{"probe_tag":"alpha"},"trace_id":"b92cbd4fa6f348b1a44ff7313e2000c6"}
{"type":"event","exception":"iso-gamma","tags":{"probe_tag":"gamma"},"trace_id":"0d6008024aec4d6493c8b3bf7711434c"}
{"type":"event","exception":"iso-beta","tags":{"probe_tag":"beta"},"trace_id":"babd8f0f17134cec9b4e0dc4d28ffd7e"}
{"type":"transaction","name":"GET /tagged","source":"route","trace_id":"b92cbd4fa6f348b1a44ff7313e2000c6","tags":{"probe_tag":"alpha"},"route":"/tagged","spans":[]}
{"type":"transaction","name":"GET /tagged","source":"route","trace_id":"0d6008024aec4d6493c8b3bf7711434c","tags":{"probe_tag":"gamma"},"route":"/tagged","spans":[]}
{"type":"transaction","name":"GET /tagged","source":"route","trace_id":"babd8f0f17134cec9b4e0dc4d28ffd7e","tags":{"probe_tag":"beta"},"route":"/tagged","spans":[]}

# incoming trace (sentry-trace aaaa...-1111111111111111-1)
{"type":"transaction","name":"GET /users/[id]","op":"http.server","source":"route","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","span_id":"849681025b7f849b","parent_span_id":"1111111111111111","route":"/users/[id]","spans":[]}

# outgoing fetch and db - both empty on bun
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","route":"/fetchout","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","route":"/db","spans":[]}

# logs
{"type":"log","items":["info: astro-bun-log-from-handler"]}
```

Recorded node control (same dist, `node --import ./sentry.server.config.mjs dist/server/entry.mjs`):

```
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","route":"/db","spans":["db SELECT id, name FROM users WHERE id > 0"]}
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","route":"/fetchout","spans":["http.client GET http://127.0.0.1:41502/rec"]}
```

Recorded recorder `/__seen`: the node run sends `sentry-trace` and `baggage`; the bun run sends neither.

## Observed on 2026-09-07

Ran once, bun 1.4.2 (the machine no longer has 1.4.0), astro 7.3.1, `@astrojs/node` 11.1.5,
mysql2 3.19.1, `traceLifecycle: 'static'`. Files: `observed-bun.txt`, `observed-node.txt`.

All seven bun verdicts match the record.

```
{"type": "event", "exception": "astro-bun-route-boom", "mechanism": "auto.middleware.astro", "handled": false, "sdk": "sentry.javascript.astro", "transaction": "GET /boom", "trace_id": "c946d808701643608c08a97159c45a59", "runtime": "node", "hasContextLine": true, "reqUrl": "http://127.0.0.1:52341/boom"}
{"type": "transaction", "name": "GET /boom", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "c946d808701643608c08a97159c45a59", "span_id": "a8a50f83218e3239", "route": "/boom", "spans": []}
{"type": "transaction", "name": "GET /users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "f4cc256638eb421c8a563010ee580170", "span_id": "b05555172a8e1ada", "route": "/users/[id]", "spans": []}

# isolation - three concurrent requests
{"type": "event", "exception": "iso-beta", "tags": {"probe_tag": "beta"}, "trace_id": "2ce0dbe19cc54d76a738cc8286f03730", "transaction": "GET /tagged"}
{"type": "event", "exception": "iso-alpha", "tags": {"probe_tag": "alpha"}, "trace_id": "13c6946566a14bc39e4d4a5105570afd", "transaction": "GET /tagged"}
{"type": "event", "exception": "iso-gamma", "tags": {"probe_tag": "gamma"}, "trace_id": "9a59690725694837ae8ea8798a180eef", "transaction": "GET /tagged"}
{"type": "transaction", "name": "GET /tagged", "op": "http.server", "source": "route", "status": "ok", "trace_id": "2ce0dbe19cc54d76a738cc8286f03730", "tags": {"probe_tag": "beta"}, "route": "/tagged", "spans": []}
{"type": "transaction", "name": "GET /tagged", "op": "http.server", "source": "route", "status": "ok", "trace_id": "13c6946566a14bc39e4d4a5105570afd", "tags": {"probe_tag": "alpha"}, "route": "/tagged", "spans": []}
{"type": "transaction", "name": "GET /tagged", "op": "http.server", "source": "route", "status": "ok", "trace_id": "9a59690725694837ae8ea8798a180eef", "tags": {"probe_tag": "gamma"}, "route": "/tagged", "spans": []}

# incoming trace
{"type": "transaction", "name": "GET /users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "span_id": "a65f9f7d672ab63e", "parent_span_id": "1111111111111111", "route": "/users/[id]", "spans": []}

# outgoing fetch and db - both empty on bun
{"type": "transaction", "name": "GET /fetchout", "op": "http.server", "source": "route", "status": "ok", "trace_id": "3fc787ea624948b1903fb1cc680e160c", "span_id": "aa97911c92e35ffe", "route": "/fetchout", "spans": []}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "4749ac1e287d4a0080963326057de190", "span_id": "8910da8ad7f5b594", "route": "/db", "spans": []}

# logs
{"type": "log", "items": ["info: astro-bun-log-from-handler"]}

# recorder /__seen after the bun run
[{"url":"/rec","sentryTrace":null,"baggage":null}]
```

Node control on the same `dist`:

```
{"type": "transaction", "name": "GET /fetchout", "op": "http.server", "source": "route", "status": "ok", "trace_id": "44d211351b8e4a86b22e538d3ead4d2b", "route": "/fetchout", "spans": ["http.client GET http://127.0.0.1:41502/rec"]}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "1a4fe3ce3d1048adbe337ab26167b902", "route": "/db", "spans": []}

# recorder /__seen after the node run
[{"url":"/rec","sentryTrace":"44d211351b8e4a86b22e538d3ead4d2b-831db468dfa77e7b-1","baggage":"sentry-environment=production,sentry-release=astro-bun-probe%401,sentry-public_key=public,sentry-trace_id=44d211351b8e4a86b22e538d3ead4d2b,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.08665941228716445,sentry-sample_rate=1"}]
```

Both setup notes reproduced: `grep -rln "Sentry.init\|isInitialized" dist/server/chunks/*.mjs` matches
exactly one file (`dist/server/chunks/index_BJuMMLb9.mjs`, the `index.astro` chunk), and
`dist/server/chunks/db_Csov0Hp0.mjs` contains `tr_ch_apm_tracingChannel` with
`orchestrion:mysql2:query` and `orchestrion:mysql2:execute`.

### Difference from the record

One thing differs, and it is in the node control leg, not in the cell under test: the recorded node
control produced `spans: ["db SELECT id, name FROM users WHERE id > 0"]` for `GET /db`, this run
produced `spans: []` on node too (hit three times, including twice after the chunk was warm). The
build-time channel injection is present in the chunk in both cases, so on this machine today the
`mysql2` db span is missing on node as well as on bun. That weakens the record's "same dist works on
node" contrast for db spans specifically, but it does not change the bun verdict: db spans are
`broken` on bun either way. The outgoing-fetch contrast still holds exactly as recorded, node
produces the `http.client` span and both headers, bun produces neither.

Environment deltas versus the record: bun 1.4.2 rather than 1.4.0, `@astrojs/node` 11.1.5 rather
than 10.x (`@astrojs/node@latest`, as the recorded command says, now resolves to 11 for Astro 7).
