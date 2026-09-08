# M-nuxt-bun — Nuxt 4.5.2 (Nitro `bun` preset) + @sentry/nuxt on Bun

## What it reproduces

Nuxt 4.5.2 (Nitro 2.13.4, h3 1.15.11) built with `NITRO_PRESET=bun` and served by `bun run .output/server/index.mjs`,
with `@sentry/nuxt` 10.67.0 (develop / v11 line) initialized through `autoInjectServerSentry: 'top-level-import'`.
The point of the cell is that the wiring a docs page would show today (`sentry.server.config.ts` importing
`@sentry/nuxt`, i.e. `@sentry/node` under the hood) boots and reports errors and logs on bun but is tracing-blind:
zero spans, one process-wide trace id, incoming `sentry-trace` ignored, no outgoing-fetch propagation. Changing the
single import in `sentry.server.config.ts` to `@sentry/bun` restores server spans, parameterized route names, trace
continuation, per-request isolation and outgoing-fetch headers. The nitro `bun` preset serves through `Bun.serve`,
which `@sentry/node`'s HTTP instrumentation never sees.

## Install

```
npm install --no-audit --no-fund \
  $S/pack/sentry-nuxt-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-browser-10.67.0.tgz $S/pack/sentry-vue-10.67.0.tgz \
  $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-bundler-plugins-10.67.0.tgz $S/pack/sentry-bun-10.67.0.tgz mysql2
```

with `S=$SCRATCH`
(the same tarballs are mirrored in `$REPRO/_toolbox/pack`). Use npm, not
`bun add`: bun cannot resolve the tarballs' transitive `@sentry/*@10.67.0`. `@sentry/bundler-plugins` from develop is
required; with the registry build `nuxt build` dies with
`TypeError: (0 , _core.nodeStackLineParser) is not a function`.

`.output/` is checked in (8.6 MB, self-contained: it carries its own `.output/server/node_modules`), so the app runs
without reinstalling. Reinstall only to rebuild after changing sources or swapping the Sentry variant.

## Run

```
S=$SCRATCH
D=$REPRO/cells/M-nuxt-bun

# sinks (sink.mjs is $S/qs/sink.mjs with span attributes and event trace ids kept)
PORT=34118 node $D/sink.mjs > $D/sink.log 2>&1 &
PORT=34119 node $D/recorder.mjs > $D/recorder.log 2>&1 &

# variant A, the documented wiring (this is what sentry.server.config.ts holds and what .output was built from)
cat > $D/sentry.server.config.ts <<'EOF'
import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://publickey@o0.ingest.sentry.io/0',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT ?? 34118}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.SENTRY_LIFECYCLE === 'static' ? 'static' : 'stream',
  debug: true,
})
EOF

# variant B, the one that works: same file with `import * as Sentry from '@sentry/bun'`
# (kept verbatim as sentry.server.config.bun.ts; variant A is kept as sentry.server.config.nuxt.ts)

cd $D && NITRO_PRESET=bun npx nuxt build
PORT=34117 SINK_PORT=34118 RECORDER_PORT=34119 bun run .output/server/index.mjs
PORT=34117 SINK_PORT=34118 RECORDER_PORT=34119 SENTRY_LIFECYCLE=static bun run .output/server/index.mjs   # static variant

# probes
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:34117/api/error
curl -s http://127.0.0.1:34117/users/55
TR="12345678901234567890123456789012-1234567890123456-1"
BG="sentry-trace_id=12345678901234567890123456789012,sentry-environment=probe,sentry-public_key=publickey,sentry-sample_rate=1,sentry-sampled=true"
curl -s -H "sentry-trace: $TR" -H "baggage: $BG" http://127.0.0.1:34117/users/9
curl -s -H "sentry-trace: $TR" -H "baggage: $BG" "http://127.0.0.1:34117/api/iso?tag=traced"
curl -s http://127.0.0.1:34117/api/db
(curl -s "http://127.0.0.1:34117/api/iso?tag=alpha" & curl -s "http://127.0.0.1:34117/api/iso?tag=beta" & curl -s "http://127.0.0.1:34117/api/iso?tag=gamma" & wait)
curl -s http://127.0.0.1:34117/api/fetchout
curl -s http://127.0.0.1:34117/api/log
sleep 8 && curl -s http://127.0.0.1:34117/api/sentinel     # sentinel gates the reads
curl -s http://127.0.0.1:34118/__items
curl -s http://127.0.0.1:34119/__seen
```

MariaDB for `/api/db` is the running container on `127.0.0.1:3307` (root, no password, db `app`, table `users`).

## Expected (recorded verdict, cells.json id `M-nuxt-bun`)

| capability | recorded verdict |
| --- | --- |
| errors | works |
| route names | partial (no span at all under `@sentry/nuxt`; `GET /users/:id` with `http.route`, `sentry.segment.name.source=route`, `url.path.parameter.id=55` under `@sentry/bun`) |
| isolation | partial (tags isolate; one process-wide trace id and a leaked stale transaction under `@sentry/nuxt`) |
| incoming trace | partial (ignored under `@sentry/nuxt`; continued under `@sentry/bun`) |
| outgoing fetch | partial (no span, no headers under `@sentry/nuxt`; `http.client GET 127.0.0.1` plus headers under `@sentry/bun`) |
| db spans | partial (mysql2 v3 publishes its own diagnostics channels, `@sentry/bun` subscribes eagerly, no Bun plugin build needed; the Nuxt module's orchestrion pass injects nothing into the nitro bundle) |
| logs | works |

Recorded evidence lines:

```
boot log:
  Sentry Logger [log]: SDK initialized from ESM
  Sentry Logger [log]: [Sentry] Runtime hook not registered
  Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
  Listening on http://localhost:34117/...
  Sentry Logger [log]: Patched h3 event handler. Created new isolation scope.

errors (works):
{"type":"event","exception":"nuxt-bun-route-error","mechs":["Error:chained/handled=true","Error:auto.function.nuxt.nitro/handled=false"],"sdk":"sentry.javascript.nuxt","trace_id":"6d1c0582624d4ee98971eadb94b1bf24","transaction":"GET /api/error"}

isolation (tags ok, trace id + transaction leak):
{"type":"event","exception":"iso-beta","tags":{"probe_tag":"beta"},"trace_id":"6d1c0582624d4ee98971eadb94b1bf24","transaction":"GET /api/db"}
{"type":"event","exception":"iso-alpha","tags":{"probe_tag":"alpha"},"trace_id":"6d1c0582624d4ee98971eadb94b1bf24","transaction":"GET /api/db"}
{"type":"event","exception":"iso-gamma","tags":{"probe_tag":"gamma"},"trace_id":"6d1c0582624d4ee98971eadb94b1bf24","transaction":"GET /api/db"}

incoming trace (ignored):
{"type":"event","exception":"iso-traced","tags":{"probe_tag":"traced"},"trace_id":"6d1c0582624d4ee98971eadb94b1bf24","transaction":"GET /api/error"}

spans: NONE (stream and static lifecycle both produced zero span/transaction envelopes)

outgoing fetch (no span, no headers):
[{"url":"/rec","sentry-trace":null,"baggage":null},{"url":"/rec","sentry-trace":null,"baggage":null},{"url":"/rec","sentry-trace":null,"baggage":null}]
```

## Observed on 2026-09-07

Rebuilt and run once. Bun on this machine is **1.4.2** (the recorded 1.4.0 is not installed); everything else matches
the record (nuxt 4.5.2, nitropack 2.13.4, h3 1.15.11, @sentry/* 10.67.0 from the develop tarballs).

Boot log, variant A (`appA2.log`), identical to the record:

```
Sentry Logger [log]: SDK initialized from ESM
Sentry Logger [log]: [Sentry] Runtime hook not registered
Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
Listening on http://localhost:34117/...
Sentry Logger [log]: Patched h3 event handler. Created new isolation scope.
```

Variant A (`import * as Sentry from '@sentry/nuxt'`), stream lifecycle, full sink dump:

```
{"type": "event", "exception": "Error: nuxt-bun-route-error", "mechs": ["Error:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.nuxt", "trace_id": "cb01862f26e844f1b0efa8332e1e172e", "transaction": "GET /api/error"}
{"type": "event", "exception": "Error: iso-traced", "mechs": ["Error:generic/handled=true"], "sdk": "sentry.javascript.nuxt", "trace_id": "cb01862f26e844f1b0efa8332e1e172e", "transaction": "GET /api/error", "tags": {"probe_tag": "traced"}}
{"type": "event", "exception": "Error: iso-gamma", "sdk": "sentry.javascript.nuxt", "trace_id": "cb01862f26e844f1b0efa8332e1e172e", "transaction": "GET /api/error", "tags": {"probe_tag": "gamma"}}
{"type": "event", "exception": "Error: iso-alpha", "sdk": "sentry.javascript.nuxt", "trace_id": "cb01862f26e844f1b0efa8332e1e172e", "transaction": "GET /api/error", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-beta", "sdk": "sentry.javascript.nuxt", "trace_id": "cb01862f26e844f1b0efa8332e1e172e", "transaction": "GET /api/error", "tags": {"probe_tag": "beta"}}
{"type": "log", "items": ["info: nuxt-bun-log-line"]}
{"type": "event", "message": "sentinel", "sdk": "sentry.javascript.nuxt", "trace_id": "cb01862f26e844f1b0efa8332e1e172e", "transaction": "GET /api/error"}
recorder: [{"url":"/rec","sentry-trace":null,"baggage":null}]
```

Variant A, `SENTRY_LIFECYCLE=static`, full sink dump (still zero spans):

```
{"type": "event", "exception": "Error: nuxt-bun-route-error", "mechs": ["Error:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.nuxt", "trace_id": "02b587b43e214b929dfb1fe21a81b73a", "transaction": "GET /api/error"}
{"type": "log", "items": ["info: nuxt-bun-log-line"]}
{"type": "event", "message": "sentinel", "sdk": "sentry.javascript.nuxt", "trace_id": "02b587b43e214b929dfb1fe21a81b73a", "transaction": "GET /api/error"}
recorder: [{"url":"/rec","sentry-trace":null,"baggage":null}]
```

Variant B (`import * as Sentry from '@sentry/bun'`), stream lifecycle, the lines that carry the verdicts:

```
{"type": "event", "exception": "Error: nuxt-bun-route-error", "mechs": ["Error:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.bun", "trace_id": "9d139293bc614a4abc55f94fd88170ac", "transaction": "GET /api/error"}
{"type": "span", "items": ["http.server GET /users/:id"], "raw": [{"name": "GET /users/:id", "trace_id": "f3dc9029d1054983bd60827e3da7f11c", "is_segment": true, "op": "http.server", "origin": "auto.http.bun.serve", "segment_source": "route", "http_route": "/users/:id", "param_id": "55"}]}
{"type": "event", "exception": "Error: iso-traced", "sdk": "sentry.javascript.bun", "trace_id": "12345678901234567890123456789012", "parent_span_id": "1234567890123456", "tags": {"probe_tag": "traced"}}
{"type": "span", "items": ["http.server GET /users/:id", "http.server GET /api/iso"], "raw": [{"name": "GET /users/:id", "trace_id": "12345678901234567890123456789012", "parent_span_id": "1234567890123456", "is_segment": true, "segment_source": "route", "http_route": "/users/:id", "param_id": "9"}, ...]}
{"type": "event", "exception": "Error: iso-alpha", "trace_id": "5e88a7ff0b2f4d4eb1dde1fb52dd8304", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-beta", "trace_id": "e2ac2990d1044d2abfcfbcf3cf38730a", "tags": {"probe_tag": "beta"}}
{"type": "event", "exception": "Error: iso-gamma", "trace_id": "a797421a26e94c2e8c5076b3771cfabe", "tags": {"probe_tag": "gamma"}}
{"type": "span", "items": ["http.client GET 127.0.0.1", "http.server GET"], "raw": [{"name": "GET 127.0.0.1", "parent_span_id": "a1357ab2f5ed76a1", "is_segment": false, "op": "http.client", "origin": "auto.http.fetch"}, ...]}
{"type": "log", "items": ["info: nuxt-bun-log-line"]}
recorder: [{"url":"/rec","sentry-trace":"95081fb760b04297a2c7ecb7bdd59564-9bdc6479832b6a3d-1","baggage":"sentry-environment=production,sentry-public_key=publickey,sentry-trace_id=95081fb760b04297a2c7ecb7bdd59564,...,sentry-sampled=true,sentry-sample_rate=1"}]
```

Match per capability:

| capability | recorded | observed 2026-09-07 | match |
| --- | --- | --- | --- |
| errors | works | works, same two mechanisms, `auto.function.nuxt.nitro` handled=false, route still 500 | yes |
| route names | partial | same: no span under `@sentry/nuxt`; `GET /users/:id`, `http.route=/users/:id`, `sentry.segment.name.source=route`, `url.path.parameter.id=55` under `@sentry/bun`. New detail: `/api/*` handlers get `GET` with source `url` except `/api/iso` | yes |
| isolation | partial | same: tags isolate, one trace id (`cb0186…`) for the whole process and a stale transaction (`GET /api/error`, from an earlier request) on every event; distinct trace ids under `@sentry/bun` | yes |
| incoming trace | partial | same: ignored under `@sentry/nuxt`; continued (`trace=1234…9012 parent=1234567890123456`) under `@sentry/bun` | yes |
| outgoing fetch | partial | same: `sentry-trace: null, baggage: null` and no span under `@sentry/nuxt`; `http.client GET 127.0.0.1` child span plus both headers under `@sentry/bun` | yes |
| db spans | partial | differs: no db span under either variant. `/api/db` returns rows, `@sentry/bun` logs `[instrumentation:mysql2] Bun/Deno, subscribing eagerly` and `subscribing to channels`, but no `db.query` span reaches the sink, warm requests included | no |
| logs | works | works, `{"type": "log", "items": ["info: nuxt-bun-log-line"]}` on both variants | yes |

Two deviations from the record, both noted rather than chased:

1. `nuxt.config.ts` needed `nitro: { externals: { external: ['mysql2'] } }`. With mysql2 inside the nitro bundle every
   query dies with `TypeError: genFunc$1 is not a function. (In 'genFunc$1()', 'genFunc$1' is an instance of Module)` —
   rollup's CJS interop hands `generate-function` back as a namespace object. The failure is in the bundled driver, before
   any Sentry code runs, so it looks like a nitro/rollup interop problem rather than an SDK one.
2. With mysql2 external, its module is first loaded inside a request (nitro imports route chunks lazily), which is the
   shape of known finding K11 on bun. That is the most likely reason the recorded mysql2 span did not appear here.
