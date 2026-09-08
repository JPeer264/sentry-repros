# M-nextjs-cf — Next.js (App Router) via OpenNext on Cloudflare Workers

## What it reproduces

Next.js 15.5.25 App Router built with `@opennextjs/cloudflare` 1.20.6 and run on workerd
(`wrangler dev`, `compatibility_date` 2026-05-01, `nodejs_compat`), instrumented with
`@sentry/nextjs` 10.67.0 from the develop / v11 line. The app exposes one route handler per
capability under test (errors, parameterized route names, per-request isolation, incoming trace
continuation, outgoing `fetch` and `node:http`, `mysql2` and `mysql@2` db spans, structured logs)
and points its transport at a local envelope sink through `tunnel`, so every envelope the SDK
produces can be read back verbatim. It shows that error capture, route naming, isolation, trace
continuation, db spans through mysql2's own diagnostics channel and logs all work, while outgoing
HTTP from a route handler produces no `http.client` span and no trace headers, because
`@sentry/node`'s NodeFetch integration patches an undici that workerd does not have.

## Install

```
cd $REPRO/cells/M-nextjs-cf
npm install
```

(`package.json` references the develop tarballs in `../../_toolbox/pack` by `file:` path, so this
installs the develop SDK only. Never install a registry version of `@sentry/*` here.)

## Run

```
cd $REPRO/cells/M-nextjs-cf

# 1. envelope sink (extended: keeps trace ids, tags, and a /__rec recorder endpoint)
PORT=41337 node sink.mjs > sink.log 2>&1 &

# 2. build the worker (only needed if .open-next is stale or missing)
npx opennextjs-cloudflare build

# 3. serve it (SENTRY_TUNNEL / SENTRY_LIFECYCLE come from wrangler.jsonc `vars`)
npx wrangler dev --port 41338 --inspector-port 0 > wrangler.log 2>&1 &

# 4. probes
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:41338/api/error
curl -s http://127.0.0.1:41338/api/users/42
curl -s "http://127.0.0.1:41338/api/iso?t=alpha" & curl -s "http://127.0.0.1:41338/api/iso?t=bravo" & \
  curl -s "http://127.0.0.1:41338/api/iso?t=charlie" & wait
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
     -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe-env,sentry-public_key=abc123,sentry-sample_rate=1" \
     http://127.0.0.1:41338/api/ping
curl -s "http://127.0.0.1:41338/api/outfetch?rec=http%3A%2F%2F127.0.0.1%3A41337%2F__rec"
curl -s "http://127.0.0.1:41338/api/outhttp?rec=http%3A%2F%2F127.0.0.1%3A41337%2F__rec"
curl -s http://127.0.0.1:41338/api/db
curl -s http://127.0.0.1:41338/api/db2
curl -s http://127.0.0.1:41338/api/logs
curl -s "http://127.0.0.1:41338/api/sentinel?n=1"

# 5. read the sink
curl -s http://127.0.0.1:41337/__items | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{JSON.parse(s).forEach(i=>console.log(JSON.stringify(i)))})"
curl -s -X DELETE http://127.0.0.1:41337/__items
```

MariaDB must be reachable on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`).

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | broken |
| db spans | partial |
| logs | works |
| client errors | not-run (browser side out of scope) |

Recorded evidence lines:

```
{"type":"event","exception":"m-nextjs-cf route handler boom","mechanism":"auto.function.nextjs.route_handler","handled":false,"sdk":"sentry.javascript.nextjs","transaction":"GET /api/error","trace_id":"c26e37940a504bb49747b3c642bb106a","hasContextLine":false}
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"route","status":"internal_error",...}
{"type":"transaction","name":"GET /api/users/[id]","op":"http.server","source":"route","status":"ok","spans":["undefined resolve page components","undefined executing api route (app) /api/users/[id]/route","undefined start response"]}
{"type":"event","exception":"iso-bravo","tags":{"probe_tag":"bravo"},"trace_id":"eefb76c8ff9a48a2b7d211f58adef50c"}
{"type":"event","exception":"iso-alpha","tags":{"probe_tag":"alpha"},"trace_id":"46119eee3fdb4e5ab9add036c535a32e"}
{"type":"event","exception":"iso-charlie","tags":{"probe_tag":"charlie"},"trace_id":"51997b4843784834a749d284a7af4848"}
{"type":"transaction","name":"GET /api/ping","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","span_id":"83c183dd19c97d67","parent_span_id":"bbbbbbbbbbbbbbbb",...}
db spans: `db mysql2.pool.connect`, `db mysql2.connect`, `db SELECT id, name FROM users`
logs: `info: m-nextjs-cf log from route handler`
init warning on workerd: "[Sentry] Failed to register diagnostics-channel injection hooks, so channel-based integrations will not record spans."
```

## Observed on 2026-09-07

All eight capabilities were re-run against a fresh `opennextjs-cloudflare build` on this machine.
Verbatim trimmed sink lines (full dump in `observed-2026-09-07.jsonl`):

```
errors:          {"type":"event","exception":"Error: m-nextjs-cf route handler boom","mechanism":"auto.function.nextjs.route_handler","handled":false,"sdk":"sentry.javascript.nextjs","runtime":{"name":"cloudflare"},"hasContextLine":false,"transaction":"GET /api/error","trace_id":"62a8b606a471400e97ff13e292758574"}  (HTTP 500)
route names:     {"type":"transaction","name":"GET /api/users/[id]","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /api/users/[id]/route","start response"]}
isolation:       {"type":"event","exception":"Error: iso-alpha","tags":{"probe_tag":"alpha"},"trace_id":"433258f548b34ba78e0d206ba3f2ea6f"}
                 {"type":"event","exception":"Error: iso-charlie","tags":{"probe_tag":"charlie"},"trace_id":"8797df7c68d24bdba0f5931fcac90a7f"}
                 {"type":"event","exception":"Error: iso-bravo","tags":{"probe_tag":"bravo"},"trace_id":"7e332c7aad89409d9e02b3ba5199e901"}
incoming trace:  {"type":"transaction","name":"GET /api/ping","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","span_id":"b51249585e8342d2","parent_span_id":"bbbbbbbbbbbbbbbb"}
outgoing fetch:  {"type":"recorder","url":"/__rec?via=fetch","sentryTrace":null,"baggage":null}
                 {"type":"recorder","url":"/__rec?via=nodehttp","sentryTrace":null,"baggage":null}
                 {"type":"transaction","name":"GET /api/outfetch","spans":["resolve page components","executing api route (app) /api/outfetch/route","start response"]}
db spans:        {"type":"transaction","name":"GET /api/db","spans":["resolve page components","executing api route (app) /api/db/route","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users","start response"]}
                 {"type":"transaction","name":"GET /api/db2","spans":["resolve page components","executing api route (app) /api/db2/route","start response"]}
logs:            {"type":"log","items":["info: m-nextjs-cf log from route handler"]}
client errors:   not-run (browser side out of scope, as recorded)
init warning:    [Sentry] Failed to register diagnostics-channel injection hooks, so channel-based integrations will not record spans.
```

Match: yes. Every recorded verdict reproduced, including the broken outgoing fetch (no
`http.client` span, `sentry-trace: null` and `baggage: null` at the recorder for both `fetch` and
`node:http`), the mysql2-only db spans with `mysql@2` producing none, and the
diagnostics-channel registration warning at init.

Two rebuild-only deltas, neither changing a verdict:

- The `build` script in `package.json` must be `next build`. The recovered partial copy had
  `opennextjs-cloudflare build` there, which makes `opennextjs-cloudflare build` recurse into
  itself and never finish.
- `mysql2`'s pool needs `disableEval: true` on workerd. Without it `pool.query` throws
  `EvalError: Code generation from strings disallowed for this context` (mysql2 compiles row
  parsers with `new Function`). The db spans are emitted either way, so the recorded "partial"
  verdict holds; with `disableEval` the route also returns rows and HTTP 200 instead of 500.
  A `mysql-shim.d.ts` with `declare module 'mysql';` is needed as well, or the Next build fails
  its type check on the untyped `mysql@2` import.

`node_modules` was removed after the run; `.open-next` (42 MB) is kept so the app runs without a
rebuild. `.next` (229 MB) is left behind because this environment forbids `rm` on anything but
`node_modules`; it is safe to delete by hand.
