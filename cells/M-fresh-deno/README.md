# M-fresh-deno

Fresh 2 (`@fresh/core` 2.3.3, `@fresh/plugin-vite` 1.1.2, scaffolded with `jsr:@fresh/init@2.3.3`) on
Deno 2.9.0 with `@sentry/deno` 10.67.0 from develop (`6f2da7483d`, tarballs under `_toolbox/pack`).

## What it reproduces

A Fresh 2 app instrumented by hand with the Deno SDK, exercising the seven capabilities of the
framework matrix: errors, route names, request isolation, incoming trace continuation, outgoing
`fetch`, database spans and logs. Fresh itself is not instrumented by the SDK at all: `App.handler()`
catches every route error and returns its own 500, so nothing reaches Sentry's handlers, and nothing
names the route, so the server span is `GET` (stream) or the raw path with `source: url` (static).
Both holes are closed only by the hand-written middleware in `app/main.ts`, which reads `ctx.route`
onto the root span and re-captures the error before rethrowing. What works without any wiring is
incoming trace continuation and logs; what stays broken is the outgoing `fetch` (no `http.client`
span, no `sentry-trace`/`baggage` headers — the known Deno gap K2). `mysql@2` spans need
`import "@sentry/deno/import";` plus `ssr.external: ["mysql"]` in `vite.config.ts`. Request isolation
is correct under `vite` dev but leaks in the `deno serve _fresh/server.js` build, where a tag set by
one request stays on every later request.

Files: `app/instrument.ts` (SDK init, hook first), `app/main.ts` (Fresh app, the Sentry middleware is
skipped when `NO_SENTRY_MW=1`), `app/routes/api/*` (one route per capability), `sink2.mjs` (the
`_toolbox` envelope sink extended with trace/span ids, tags, `http.route`, richer span items and a
`/__rec` endpoint that records the headers of incoming downstream requests), `drive.sh` (one pass
over every route, ending in a sentinel), `install.sh` (restores both `node_modules` trees).
`observed-*.json` are the sink dumps quoted under "Observed"; `*.log` are the stdout of each run.
`app/_fresh/` is the committed build output (2 MB) so the production shape runs without a rebuild.

## Install

```
bash $REPRO/cells/M-fresh-deno/install.sh
```

`install.sh` runs `npm install` at the cell root (the five SDK tarballs by relative path under
`_toolbox/pack` plus `mysql@2`), then `deno install` inside `app/` to restore Deno's own tree, then
copies `@sentry`, `mysql` and the driver's CommonJS dependencies into `app/node_modules` — the Deno
import hook only transforms packages under a local `node_modules`, and npm cannot write into Deno's
`.deno` layout without pruning it. MariaDB must be reachable on `127.0.0.1:3307` (user `root`, no
password, database `app`, table `users`).

## Run

```
cd $REPRO/cells/M-fresh-deno

# sink + downstream header recorder on 41317
PORT=41317 node sink2.mjs > sink.log 2>&1 &

# vite dev, static lifecycle (transaction envelopes with nested spans[])
(cd app && SINK_PORT=41317 SENTRY_LIFECYCLE=static deno task dev --port 41320 --strictPort &)
bash drive.sh http://127.0.0.1:41320        # boom, users/:id, 3 concurrent iso, out, db x2, log, traced msg, sentinel
curl -s http://127.0.0.1:41317/__items      # envelopes
curl -s http://127.0.0.1:41317/__recs       # headers seen on the outgoing fetch
curl -s -X DELETE http://127.0.0.1:41317/__items

# vite dev, default stream lifecycle: SENTRY_LIFECYCLE=stream, port 41321
# baseline without the Sentry middleware: NO_SENTRY_MW=1 (either lifecycle), ports 41322 / 41323

# production shape
(cd app && deno task build)
(cd app && SINK_PORT=41317 SENTRY_LIFECYCLE=static deno serve -A --port 41324 _fresh/server.js &)
bash drive.sh http://127.0.0.1:41324
curl -s "http://127.0.0.1:41324/api/iso?t=seq1"; curl -s http://127.0.0.1:41324/api/users/7   # isolation leak check
```

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | **partial** (only via a user middleware; Fresh swallows the error) |
| route names | **partial** (only via a user middleware reading `ctx.route`) |
| isolation | **partial** (correct in vite dev, leaks in the `deno serve` build) |
| incoming trace | works |
| outgoing fetch | **broken** (no span, no headers — Deno gap K2) |
| db spans | **partial** (needs the import hook and `ssr.external: ["mysql"]`) |
| logs | works |

Recorded evidence lines:

```
Baseline, NO Sentry middleware, vite dev, static — Fresh swallows the error and the name is the raw URL:
  transaction | GET /api/boom | src= url | mech= None        <- no event for the thrown error
  transaction | GET /api/users/42 | src= url | mech= None
  event | sentinel | src= None | mech= generic

Baseline, NO Sentry middleware, vite dev, stream:
  span | ['http.server | GET | src=url | route=- | trace=2845c4e98f6c4ed095482253f6960a24 | parent=-']

With the Sentry middleware, vite dev, static (errors + route names + isolation + incoming trace):
  event | fresh-deno-boom | mech= fresh.middleware handled=False | tags=None | trace=6576decf1ee54d29868ad64a39c4063b | tx=GET /api/boom
  transaction | GET /api/users/:id | op=http.server | src=route | status=ok | trace=00e22f253ed8403bb175be15476d1fe6 | spans=[]
  transaction | GET /api/iso | op=http.server | src=route | status=ok | trace=87c516d0b0ac45a0843b1ae965b9c5e4 | tags={'probe': 'a'} | spans=[]
  transaction | GET /api/iso | op=http.server | src=route | status=ok | trace=1f7bc5aeafc2472d8a092e46f3bdd75f | tags={'probe': 'b'} | spans=[]
  transaction | GET /api/iso | op=http.server | src=route | status=ok | trace=359f4d0fdce841e49292a13aa06b21e7 | tags={'probe': 'c'} | spans=[]
  event | iso-a | mech=generic handled=True | tags={'probe': 'a'} | trace=87c516d0b0ac45a0843b1ae965b9c5e4
  event | iso-b | mech=generic handled=True | tags={'probe': 'b'} | trace=1f7bc5aeafc2472d8a092e46f3bdd75f
  event | iso-c | mech=generic handled=True | tags={'probe': 'c'} | trace=359f4d0fdce841e49292a13aa06b21e7
  transaction | GET /api/out | op=http.server | src=route | status=ok | trace=b85a8854454442bbae911ab28860db96 | tags=None | spans=[]
  transaction | GET /api/msg | op=http.server | src=route | status=ok | trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | parent=bbbbbbbbbbbbbbbb | spans=[]
  event | fresh-deno-msg | mech=generic handled=True | trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | parent=bbbbbbbbbbbbbbbb
  log | ['info: fresh-deno-log-line']

Outgoing fetch recorder, both shapes:
  [{"url":"/__rec?from=fresh","sentry-trace":null,"baggage":null}]

db, vite dev, static (mysql@2, module-scope connection, second and later requests):
  transaction | GET /api/db | op=http.server | src=route | trace=a2fe4abc873d41d6a0ce28c60988b5f2 | spans=['db | SELECT * FROM users | ""']
  transaction | GET /api/db | op=http.server | src=route | trace=73b8cf1e7818480a89714bdabd1a8287 | spans=['db | SELECT * FROM users | ""']
db, first query after connect (own root transaction, own trace):
  transaction | SELECT * FROM users | op=db | src=custom | trace=1b5156d23aed4cadacdf8895d9ff1152 | spans=[]
db, vite dev, stream:
  span | db | SELECT users | src=- | route=- | trace=3e312cc2f23642669915656843d93417 | parent=829bba685226b16b
  span | http.server | GET /api/db | src=route | route=/api/db | trace=3e312cc2f23642669915656843d93417 | parent=-
```

The recorded isolation detail: "vite dev (node:http path): correct — three concurrent `/api/iso?t=a|b|c`
requests each produced an event and a transaction with only its own tag and its own trace id, and later
requests carried tags=None. The `deno serve _fresh/server.js` build leaks: after the same three
concurrent requests, every subsequent transaction and event carried `tags={'probe': 'a'}`."

## Observed on 2026-09-07

Rebuilt from the recorded setup and run once, in all four shapes (vite dev static, vite dev stream,
both baselines without the middleware, and the `deno serve` build). **All seven capabilities match the
recorded verdicts.** Trace ids differ per run, as they must; which of the three concurrent tags wins
the leak in the build shape is a race and came out `b` here rather than the recorded `a`.

vite dev, static, Sentry middleware on (`observed-dev-static-items.json`):

```
{"type": "event", "exception": "Error: fresh-deno-boom", "mechanism": "fresh.middleware", "handled": false, "sdk": "sentry.javascript.deno", "trace_id": "c4b34e96923d4bebb803f9b2e298a04f", "hasContextLine": true}
{"type": "transaction", "name": "GET /api/users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "003af7c8ab9241a086ba2156c40f3ad0", "sdk": "sentry.javascript.deno", "http_route": "/api/users/:id", "spans": []}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "6568c1ecf1b245c286d558d2b3cd8dde", "tags": {"probe": "a"}, "http_route": "/api/iso", "spans": []}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "59c6e9c17d534b9aa4cfc727507b43e2", "tags": {"probe": "b"}, "http_route": "/api/iso", "spans": []}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "4ccedc59ac93401abddd3a80fd46d244", "tags": {"probe": "c"}, "http_route": "/api/iso", "spans": []}
{"type": "event", "message": "iso-a", "mechanism": "generic", "handled": true, "transaction": "GET /api/iso", "tags": {"probe": "a"}, "trace_id": "6568c1ecf1b245c286d558d2b3cd8dde"}
{"type": "event", "message": "iso-b", "mechanism": "generic", "handled": true, "transaction": "GET /api/iso", "tags": {"probe": "b"}, "trace_id": "59c6e9c17d534b9aa4cfc727507b43e2"}
{"type": "event", "message": "iso-c", "mechanism": "generic", "handled": true, "transaction": "GET /api/iso", "tags": {"probe": "c"}, "trace_id": "4ccedc59ac93401abddd3a80fd46d244"}
{"type": "transaction", "name": "GET /api/out", "op": "http.server", "source": "route", "status": "ok", "trace_id": "7671128b168a478f98076b380ce5080c", "http_route": "/api/out", "spans": []}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "e93dbbaf310149c5b1c7bf07f5dbeead", "http_route": "/api/db", "spans": ["db SELECT * FROM users"]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "a8e23c918ba94e93bcc700cef78b8658", "http_route": "/api/db", "spans": ["db SELECT * FROM users"]}
{"type": "transaction", "name": "GET /api/msg", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "span_id": "9af63679b40e2725", "parent_span_id": "bbbbbbbbbbbbbbbb", "http_route": "/api/msg", "spans": []}
{"type": "event", "message": "fresh-deno-msg", "mechanism": "generic", "handled": true, "transaction": "GET /api/msg", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
{"type": "log", "items": ["info: fresh-deno-log-line"]}
```

Outgoing fetch recorder, vite dev (`observed-dev-static-recs.json`), and the same three nulls in the
build (`observed-prod-static-recs.json`):

```
{"url": "/__rec?from=fresh", "method": "GET", "sentryTrace": null, "baggage": null, "traceparent": null}
```

vite dev, stream (`observed-dev-stream-items.json`):

```
{"type": "span", "items": [{"n": "http.server GET /api/users/:id", "trace_id": "042a5ebf4048422d9dd3a86e59d4caa0", "source": "route", "route": "/api/users/:id", "seg": "GET /api/users/:id"}]}
{"type": "span", "items": [{"n": "db SELECT users", "trace_id": "ca732c1b6be24b9d815898bb002a0071", "span_id": "b3327490dafce336", "parent_span_id": "aad5950fee1c81e3", "seg": "GET /api/db"}, {"n": "http.server GET /api/db", "trace_id": "ca732c1b6be24b9d815898bb002a0071", "span_id": "aad5950fee1c81e3", "source": "route", "route": "/api/db", "seg": "GET /api/db"}]}
{"type": "span", "items": [{"n": "http.server GET /api/out", "trace_id": "e8bcb5aae33c4cba8051831535246975", "source": "route", "route": "/api/out", "seg": "GET /api/out"}]}
{"type": "span", "items": [{"n": "http.server GET /api/msg", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "bbbbbbbbbbbbbbbb", "source": "route", "route": "/api/msg", "seg": "GET /api/msg"}]}
{"type": "log", "items": ["info: fresh-deno-log-line"]}
```

Baselines with `NO_SENTRY_MW=1` — no event for the thrown error, and the span carries no route
(`observed-dev-baseline-stream-items.json`, `observed-dev-baseline-static-items.json`):

```
{"type": "span", "items": [{"n": "http.server GET", "trace_id": "2db98971f4264779a70533277dc9db84", "source": "url", "seg": "GET"}]}
{"type": "transaction", "name": "GET /api/users/42", "op": "http.server", "source": "url", "status": "ok", "trace_id": "91f8b8d1a7754a80a43a2b67452a3387", "spans": []}
```

Fresh's own stack trace for the swallowed error, from `dev-baseline-static.log`, with the NoopTracer
the record's notes describe:

```
Error: fresh-deno-boom
    at GET (.../app/routes/api/boom.ts:8:11)
    at NoopContextManager.with (.../@opentelemetry/api/build/src/context/NoopContextManager.js:38:15)
    at NoopTracer.startActiveSpan (.../@opentelemetry/api/build/src/trace/NoopTracer.js:79:27)
    at async Object.eval [as fetch] ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/app.ts:367:24)
```

`deno serve _fresh/server.js` build, static (`observed-prod-static-items.json`) — the isolation leak,
verbatim: three concurrent iso requests, then every later envelope carries `probe: b`, including a
request issued long afterwards:

```
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "0dfe7c9805ae463a88ea76f3050c6346", "tags": {"probe": "b"}, "http_route": "/api/iso", "spans": []}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "282cb9f01dd742829451d654e69eb05f", "tags": {"probe": "a"}, "http_route": "/api/iso", "spans": []}
{"type": "transaction", "name": "GET /api/iso", "op": "http.server", "source": "route", "status": "ok", "trace_id": "8eb649f61dfc4b7e987065b211de7ba6", "tags": {"probe": "c"}, "http_route": "/api/iso", "spans": []}
{"type": "transaction", "name": "GET /api/out", "op": "http.server", "source": "route", "status": "ok", "trace_id": "3e8d8f2382a747f7906f38abce596e40", "tags": {"probe": "b"}, "http_route": "/api/out", "spans": []}
{"type": "transaction", "name": "GET /api/log", "op": "http.server", "source": "route", "status": "ok", "trace_id": "afd4ca6a0d9e4e72974f4ea664cd9da1", "tags": {"probe": "b"}, "http_route": "/api/log", "spans": []}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "tags": {"probe": "b"}, "trace_id": "07c9abee998b45c78a6e776da15aede6"}
{"type": "transaction", "name": "GET /api/users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "11cc58c294b247fb882e2da6772d49a5", "tags": {"probe": "b"}, "http_route": "/api/users/:id", "spans": []}
```

Per-capability comparison:

- **errors** — matches the recorded **partial**. With the middleware: `Error: fresh-deno-boom`,
  `mechanism: fresh.middleware`, `handled: false`, context lines. Without it: no event at all, only
  Fresh's own 500 and the stack trace on stdout.
- **route names** — matches the recorded **partial**. With the middleware: `GET /api/users/:id`,
  `source: route`, `http.route: /api/users/:id` in static and the same name plus `source: route` on
  the `http.server` span in stream. Without it: `GET` with `source: url` (stream) and
  `GET /api/users/42` with `source: url` (static).
- **isolation** — matches the recorded **partial**. vite dev: three concurrent requests, three tags,
  three trace ids, no cross-talk, later requests untagged. The build: after the same three requests,
  `/api/out`, `/api/db`, `/api/log`, `/api/msg`, `/api/sentinel` and a much later `/api/users/7` all
  carry `tags: {"probe": "b"}`.
- **incoming trace** — matches **works**. `trace_id: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
  `parent_span_id: bbbbbbbbbbbbbbbb` on the transaction, the stream span and the captured event, in
  both shapes.
- **outgoing fetch** — matches the recorded **broken**. `/api/out` has `spans: []` in static and a
  lone `http.server` span in stream, and the recorder saw `sentryTrace: null, baggage: null` in vite
  dev and in the build.
- **db spans** — matches the recorded **partial**. `db SELECT * FROM users` nested in the
  `http.server` transaction (static) and `db SELECT users` parented to the `http.server` span
  (stream), both under vite dev with the import hook and `ssr.external: ["mysql"]`.
- **logs** — matches **works**. `info: fresh-deno-log-line` arrived as a log envelope in vite dev and
  in the build.

Two small deviations, neither of which changes a verdict:

- The recorded static run shows a `GET /api/boom` transaction in the vite dev baseline. Here the dev
  shape sent no transaction for the failing request at all (only the event, when the middleware was
  on); the build shape did send it, as `GET /api/boom` with `status: internal_error`. The finding the
  line supports — no event without the middleware — reproduced exactly.
- The record notes that the very first `mysql` query after connect gets its own root transaction
  (`transaction | SELECT * FROM users | op=db | src=custom`). Both `/api/db` requests here produced a
  properly nested span instead, so that first-query artifact did not appear in this run.
- Not in the record and not part of any verdict: `/api/db` is broken in the `deno serve` build
  (`Error: Cannot find module './lib/_stream_readable.js'`), because `ssr.external` applies to the
  dev SSR graph only and the production build bundles `mysql`. The recorded db verdict is scoped to
  vite dev, which is what was compared.
