# M-remix-cf — Remix v2 on Cloudflare Workers

## What it reproduces

Remix v2 (2.17.5, Remix Vite plugin, resource routes) running on Cloudflare Workers under
`wrangler dev` (workerd, `compatibility_date` 2026-05-01, `nodejs_compat`), instrumented with the
`develop` SDK (`@sentry/remix` + `@sentry/cloudflare` 10.67.0). The worker entry composes
`wrapRequestHandler` from `@sentry/cloudflare/request` with `instrumentBuild` from
`@sentry/remix/cloudflare`, and one resource route per capability exercises errors, route names,
request isolation, incoming trace continuation, outgoing `fetch`, `mysql` db spans and logs. Two
deliberate negative controls are part of the reproduction: `server-noals.ts` (identical, but without
`setAsyncLocalStorageAsyncContextStrategy()`) shows that `wrapRequestHandler` has no request
isolation on its own, and removing `export const handleError = sentryHandleError` from
`app/entry.server.tsx` shows that Remix swallows loader throws entirely — no event envelope at all.

## Install

```
npm install --legacy-peer-deps --no-audit --no-fund
```

(`package.json` points the `@sentry/*` deps at the tarballs in `../../_toolbox/pack/`.
`--legacy-peer-deps` is required: `@remix-run/cloudflare` pins `@cloudflare/workers-types@^4`,
wrangler 4 pins `^5`.)

## Run

```
cd $REPRO/cells/M-remix-cf

# 1. sink + fetch recorder
PORT=45731 node sink.mjs > sink.log 2>&1 &
PORT=45732 node recorder.mjs > recorder.log 2>&1 &

# 2. build (plain `vite build` builds ONLY the client under Vite 6 and silently skips
#    build/server — `remix vite:build` is mandatory)
npx remix vite:build

# 3. working shape: wrapRequestHandler + instrumentBuild + setAsyncLocalStorageAsyncContextStrategy
npx wrangler dev --port 45734 --inspector-port 0 > wrangler.log 2>&1 &
#    wait for "Ready on http://localhost:45734"

# 4. probes
curl -s -X DELETE http://127.0.0.1:45731/__items
curl -s -X DELETE http://127.0.0.1:45732/__hits
curl -s http://127.0.0.1:45734/users/42
curl -s http://127.0.0.1:45734/boom/7
for t in alpha bravo charlie; do curl -s -o /dev/null "http://127.0.0.1:45734/tagged/$t" & done; wait
curl -s -H "sentry-trace: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-2222222222222222-1" \
     -H "baggage: sentry-trace_id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" \
     http://127.0.0.1:45734/users/9
curl -s http://127.0.0.1:45734/fetchout
curl -s http://127.0.0.1:45734/dbq
curl -s http://127.0.0.1:45734/logline
curl -s http://127.0.0.1:45734/sentinel        # sentinel: wait until it shows up in the sink
sleep 8
curl -s http://127.0.0.1:45731/__items | python3 -m json.tool
curl -s http://127.0.0.1:45732/__hits  | python3 -m json.tool

# 5. isolation negative control (no setAsyncLocalStorageAsyncContextStrategy)
npx wrangler dev --config wrangler-noals.jsonc --port 45733 --inspector-port 0 > wrangler-noals.log 2>&1 &
curl -s -X DELETE http://127.0.0.1:45731/__items
for t in alpha bravo charlie; do curl -s -o /dev/null "http://127.0.0.1:45733/tagged/$t" & done; wait
curl -s http://127.0.0.1:45733/sentinel
sleep 8; curl -s http://127.0.0.1:45731/__items | python3 -m json.tool

# 6. errors negative control (no `export const handleError`)
#    comment out line 7 of app/entry.server.tsx, `npx remix vite:build`, restart the worker,
#    hit /boom/7 and /sentinel, then restore the line and rebuild.
```

MariaDB for `/dbq` is the prepared container on `127.0.0.1:3307` (root, no password, db `app`,
table `users`).

## Expected (recorded verdict)

| capability | verdict |
| --- | --- |
| errors | partial — event only with `export const handleError = sentryHandleError` |
| route names | works |
| isolation | broken — `wrapRequestHandler` alone does not isolate |
| incoming trace | works |
| outgoing fetch | works |
| db spans | partial — only with `sentryCloudflareVitePlugin` + `ssr.noExternal: true` |
| logs | works |

Recorded evidence lines:

```
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace": "64291fe1b9b745a6baf5de73fb108fd0", "route": "/users/:id", "spans": ["function routes/users.$id"]}
{"type": "event", "exception": "remix-cf loader error 7", "mechanism": "auto.function.remix.server", "handled": false, "sdk": "sentry.javascript.cloudflare", "trace": "e43f095942a0439fac2a969131300faf", "url": "http://127.0.0.1:41734/boom/7"}
{"type": "transaction", "name": "GET /boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace": "e43f095942a0439fac2a969131300faf", "route": "/boom/:id", "spans": ["function routes/boom.$id"]}

Errors BEFORE adding `export const handleError = sentryHandleError` (same route, no event at all):
boom status=500
{"type": "transaction", "name": "/boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace": "f740fa7030d7417ca013e372ea36a3db", "route": "/boom/:id", "spans": ["function routes/boom.$id"]}

Isolation WITHOUT setAsyncLocalStorageAsyncContextStrategy() (3 concurrent + a later sentinel, every event tagged `bravo`):
{"type": "event", "exception": "iso-alpha", "handled": true, "tags": {"probe_tag": "bravo"}, "trace": "1a404e370c4b4f15bc823366eea04226"}
{"type": "event", "exception": "iso-charlie", "handled": true, "tags": {"probe_tag": "bravo"}, "trace": "08db9ccbc7c14feb8a2bce7bf41a9b06"}
{"type": "event", "exception": "iso-bravo", "handled": true, "tags": {"probe_tag": "bravo"}, "trace": "d7c5afc387264b51a535f040972eabd1"}
{"type": "event", "message": "sentinel", "handled": true, "tags": {"probe_tag": "bravo"}, "trace": "d5197cad1fe84449b4d4e13c1538c20f"}

Isolation WITH setAsyncLocalStorageAsyncContextStrategy():
{"type": "event", "exception": "iso-alpha", "tags": {"probe_tag": "alpha"}, "trace": "0933193a72fe4128a5fd70dc59cf6603", "url": "http://127.0.0.1:41734/tagged/alpha"}
{"type": "event", "exception": "iso-bravo", "tags": {"probe_tag": "bravo"}, "trace": "4d2f47a7b1614d7ba22cad0fbb3e302a", "url": "http://127.0.0.1:41734/tagged/bravo"}
{"type": "event", "exception": "iso-charlie", "tags": {"probe_tag": "charlie"}, "trace": "a7aacd7f5f4b4f1692b61e6194f79bdf", "url": "http://127.0.0.1:41734/tagged/charlie"}
{"type": "event", "message": "sentinel", "sdk": "sentry.javascript.cloudflare", "trace": "ba3d60c114114cb1968b0753dcc7e236"}   <- no leaked tag

{"type": "transaction", "name": "GET /users/:id", ... "trace": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "parent": "2222222222222222", "route": "/users/:id", "spans": ["function routes/users.$id"]}
```

Outgoing fetch: child span `http.client GET http://127.0.0.1:41732/rec` plus `sentry-trace`
`86bd4dd06bb5404dab528e11bb7f3c12-813338b331b12b78-1` and baggage with
`sentry-transaction=GET%20%2Ffetchout` at the recorder.
Db: child span `db SELECT id, name FROM users`.
Logs: log envelope item `info: remix-cf log line`.

## Observed on 2026-09-07

Ports 41731/41732/41734/41733 of the record map to 45731/45732/45734/45733 here. All seven
capabilities reproduce; `matches: yes`.

Working shape (`wrangler.jsonc` + `server.ts`, port 45734), full sink dump in `items-run2.txt`:

```
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace": "bd2d5de7112b48328b0b44c43c0b5ae7", "route": "/users/:id", "spans": ["function routes/users.$id"]}
{"type": "event", "exception": "remix-cf loader error 7", "mechanism": "auto.function.remix.server", "handled": false, "sdk": "sentry.javascript.cloudflare", "trace": "ce97a71ba7e94e52932587fdb3f7ec54", "url": "http://127.0.0.1:45734/boom/7"}
{"type": "transaction", "name": "GET /boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace": "ce97a71ba7e94e52932587fdb3f7ec54", "route": "/boom/:id", "spans": ["function routes/boom.$id"]}
{"type": "event", "exception": "iso-bravo", "mechanism": "generic", "handled": true, "trace": "b821ee3baa164cb38588900e3979683a", "tags": {"probe_tag": "bravo"}, "url": "http://127.0.0.1:45734/tagged/bravo"}
{"type": "event", "exception": "iso-alpha", "mechanism": "generic", "handled": true, "trace": "95f640641e6c4a0fa205495fa85d01f4", "tags": {"probe_tag": "alpha"}, "url": "http://127.0.0.1:45734/tagged/alpha"}
{"type": "event", "exception": "iso-charlie", "mechanism": "generic", "handled": true, "trace": "3494c34aba86409297925e7f7c31d392", "tags": {"probe_tag": "charlie"}, "url": "http://127.0.0.1:45734/tagged/charlie"}
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "parent": "2222222222222222", "route": "/users/:id", "spans": ["function routes/users.$id"]}
{"type": "transaction", "name": "GET /fetchout", "op": "http.server", "source": "route", "status": "ok", "trace": "7d09dfec36294dcf917331e1db89b801", "route": "/fetchout", "spans": ["function routes/fetchout", "http.client GET http://127.0.0.1:45732/rec"]}
{"type": "transaction", "name": "GET /dbq", "op": "http.server", "source": "route", "status": "ok", "trace": "b0cb6b85462a498191ca84e4f0a4735d", "route": "/dbq", "spans": ["function routes/dbq", "db SELECT id, name FROM users"]}
{"type": "log", "items": ["info: remix-cf log line"]}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "trace": "5e7804f71cd6416986ec0bedae396787", "url": "http://127.0.0.1:45734/sentinel"}   <- no leaked tag
```

Recorder (`hits-run2.txt`):

```
{"url": "/rec",
 "sentryTrace": "7d09dfec36294dcf917331e1db89b801-be8aaaca87045ea4-1",
 "baggage": "sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=7d09dfec36294dcf917331e1db89b801,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.5320178580539497,sentry-sample_rate=1"}
```

Isolation negative control (`wrangler-noals.jsonc` + `server-noals.ts`, port 45733,
`items-noals-run2.txt`) — three concurrent requests and a later unrelated sentinel all carry
`bravo`:

```
{"type": "event", "exception": "iso-alpha", "handled": true, "trace": "c6f1eec95de24fa4923be35cd6ee617d", "tags": {"probe_tag": "bravo"}}
{"type": "event", "exception": "iso-charlie", "handled": true, "trace": "73c79eaa95e247eb9ad9e55ec538d030", "tags": {"probe_tag": "bravo"}}
{"type": "event", "exception": "iso-bravo", "handled": true, "trace": "c956fc85b2b04dc5b420f33050c259b2", "tags": {"probe_tag": "bravo"}}
{"type": "event", "message": "sentinel", "handled": true, "trace": "1ad05baefa604c9daa5524ccbb0913e6", "tags": {"probe_tag": "bravo"}}
```

Errors negative control (`handleError` export commented out, rebuilt, `items-nohandleerror-run2.txt`):

```
boom status=500
{"type": "transaction", "name": "GET /boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace": "dad2e146f12a4433a107cca28fc4e71d", "route": "/boom/:id", "spans": ["function routes/boom.$id"]}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "trace": "ad61539b41e044968fef2e0f5d6f6873", "url": "http://127.0.0.1:45734/sentinel"}
```

No error event for `/boom/7` at all, exactly as recorded. The only cosmetic difference from the
record is the transaction name in this control: the record shows `/boom/:id`, this run shows
`GET /boom/:id`. Nothing else differs.
