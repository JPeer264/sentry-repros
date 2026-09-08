# M-remix-bun

Remix v2 (`@remix-run/dev` 2.17.x Vite plugin + `@remix-run/express` adapter) with
`@sentry/remix` 10.67.0 (develop / v11 line) on Bun.

## What it reproduces

Remix v2 itself is fully viable on Bun: `bun x remix vite:build` and `bun server.mjs` both run
unmodified and `Sentry.isInitialized()` is `true`. But there is no Bun run shape that gives a
correct SDK, and the two available shapes fail in opposite directions. Plain `bun server.mjs`
(Mode A) gets errors, per-request isolation, incoming-trace continuation and logs, but emits
**zero** transaction or span envelopes, so there are no route names, no db spans and no
`http.client` spans, because `@sentry/remix` sets `disableIncomingRequestSpans: true` and relies on
the orchestrion-injected `@remix-run/server-runtime` channels that plain `bun run` never applies.
Bundling with `Bun.build` + `sentryBunPlugin()` (Mode B) restores the whole span tree (route names
with `source: route`, `LOADER` spans, mysql2 spans) but **destroys request isolation**: every
request in the process shares one trace id, tags set in one request leak onto every later event,
and an incoming `sentry-trace` header is ignored. The root cause of Mode B is that
`instrumentServer()` monkeypatches `createRequestHandler` through a CJS
`loadModule('@remix-run/server-runtime', module)` (`packages/remix/src/server/instrumentServer.ts:538`)
while `sentryBunPlugin` force-un-externalizes every instrumented package
(`withoutInstrumentedExternals` in `packages/server-utils/src/orchestrion/bundler/bun.ts`), so the
patch lands on an unused `node_modules` copy.

## Install

```
cd $REPRO/cells/M-remix-bun && npm install --no-audit --no-fund
```

(`package.json` points every `@sentry/*` at the 10.67.0 tarballs in `../../_toolbox/pack/`. Use
`npm`, not `bun add`: `bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps.)

## Run

```
C=$REPRO/cells/M-remix-bun
cd $C

# sink + outgoing-fetch recorder
PORT=36211 node sink2.mjs > sink.log 2>&1 &      sink=$!
PORT=36213 node recorder.mjs > recorder.log 2>&1 & rec=$!

# build the Remix app (works unmodified on Bun)
bun x remix vite:build

# --- Mode A: plain bun ---
PORT=36215 SINK_URL=http://127.0.0.1:36211/ RECORDER_URL=http://127.0.0.1:36213 \
  NODE_ENV=production bun server.mjs > modeA.log 2>&1 & app=$!

# --- Mode B: Bun.build + sentryBunPlugin ---
bun build-server.ts
PORT=36215 SINK_URL=http://127.0.0.1:36211/ RECORDER_URL=http://127.0.0.1:36213 \
  NODE_ENV=production bun dist/server.js > modeB.log 2>&1 & app=$!

# probes (run against whichever mode is up; clear the sink between blocks)
for u in /users/42 /db /log /outfetch /boom/7 /sentinel; do
  curl -s -o /dev/null -w "$u %{http_code}\n" http://127.0.0.1:36215$u; done

curl -s -o /dev/null http://127.0.0.1:36215/iso/a & \
curl -s -o /dev/null http://127.0.0.1:36215/iso/b & \
curl -s -o /dev/null http://127.0.0.1:36215/iso/c & wait
curl -s -o /dev/null http://127.0.0.1:36215/sentinel

curl -s -o /dev/null -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
  -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=upstream,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' \
  http://127.0.0.1:36215/boom/trace
curl -s -o /dev/null http://127.0.0.1:36215/sentinel   # sentinel, then read

curl -s http://127.0.0.1:36211/__items        # envelopes (wait ~7s more for logs)
curl -s http://127.0.0.1:36213/__hits         # headers seen on the outgoing fetch
curl -s -X DELETE http://127.0.0.1:36211/__items   # clear between blocks

kill $app; kill $sink; kill $rec
```

## Expected

Recorded verdicts (cells.json, id `M-remix-bun`):

| capability | verdict |
| --- | --- |
| errors | works (both modes) |
| route names | partial (Mode A none at all, Mode B `GET users/:id` + `source: route`) |
| isolation | partial (Mode A correct, Mode B one trace id for the process, tags leak) |
| incoming trace | partial (Mode A continues, Mode B ignores) |
| outgoing fetch | partial (Mode A headers only, Mode B full `http.client` span + headers) |
| db spans | partial (Mode A none, Mode B mysql2 spans under `GET db`) |
| logs | works (both modes) |
| client errors | not-run (browser half out of scope) |

Recorded evidence lines:

```
### Mode A - bun server.mjs
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.remix","trace_id":"92feedf2d409492096a1cd6de7210915","hasContextLine":true}
{"type":"event","exception":"probe-loader-boom-7","mechanism":"auto.function.remix.server","handled":false,"sdk":"sentry.javascript.remix","trace_id":"2e240ac4f06b47b3b03163469ec6fe1d","hasContextLine":true}
{"type":"log","items":["info: probe-log-from-remix-loader"]}
# ^ COMPLETE sink content for /users/42 /db /log /outfetch /boom/7 /sentinel - zero transaction and zero span envelopes.
recorder: [{"url":"/rec","sentryTrace":"a19cc67a24fc4e4086fd4082b6e06222-884e3f78b27078a5","baggage":"sentry-environment=probe,sentry-public_key=public,sentry-trace_id=a19cc67a24fc4e4086fd4082b6e06222"}]

### Mode A - isolation (CORRECT)
{"type":"event","exception":"iso-error-b","mechanism":"generic","handled":true,"tags":{"probe_tag":"tag-b"},"trace_id":"e9ccbe3786e145759bca33de00714234"}
{"type":"event","exception":"iso-error-a","mechanism":"generic","handled":true,"tags":{"probe_tag":"tag-a"},"trace_id":"355d6f6d1ee04b4aba9b474a7d011f43"}
{"type":"event","exception":"iso-error-c","mechanism":"generic","handled":true,"tags":{"probe_tag":"tag-c"},"trace_id":"9b4470941d5c4d2c9694bfc09e000ed8"}

### Mode A - incoming trace (CORRECT)
{"type":"event","exception":"probe-loader-boom-trace","mechanism":"auto.function.remix.server","handled":false,"sdk":"sentry.javascript.remix","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","hasContextLine":true}
recorder: {"url":"/rec","sentryTrace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-b141910d895fdebf-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=upstream,..."}

### Mode B - bun dist/server.js (Bun.build + sentryBunPlugin)
{"type":"transaction","name":"GET users/:id","op":"http.server","source":"route","status":"ok","trace_id":"510a3fcd98a14ddf9e60ae3a42f0c407","spans":["function LOADER routes/users.$id"]}
{"type":"transaction","name":"GET db","op":"http.server","source":"route","status":"ok","trace_id":"510a3fcd98a14ddf9e60ae3a42f0c407","spans":["function LOADER routes/db","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET outfetch","op":"http.server","source":"route","status":"ok","trace_id":"510a3fcd98a14ddf9e60ae3a42f0c407","spans":["function LOADER routes/outfetch","http.client GET http://127.0.0.1:41519/rec"]}
{"type":"event","exception":"probe-loader-boom-7","mechanism":"auto.function.remix.server","handled":false,"sdk":"sentry.javascript.remix","trace_id":"510a3fcd98a14ddf9e60ae3a42f0c407","hasContextLine":false}
```

## Observed on 2026-09-07

Rebuilt and run once on **bun 1.4.2** (the recorded run used bun 1.4.0; 1.4.0 is not on this
machine). `bun x remix vite:build` succeeded unmodified; `bun build-server.ts` produced
`dist/server.js` (4.5 MB). Sink 36211, recorder 36213, app 36215.

### Mode A - `bun server.mjs`, six requests + sentinel

```
/users/42 200
/db 200
/log 200
/outfetch 200
/boom/7 500
/sentinel 200
{"type": "event", "exception": "probe-loader-boom-7", "mechanism": "auto.function.remix.server", "handled": false, "sdk": "sentry.javascript.remix", "trace_id": "b5745d0b432c4609838aa211a177d190", "hasContextLine": true}
{"type": "event", "message": "sentinel", "exception": "sentinel", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.remix", "trace_id": "3288448ac94547ba8f9d78d5c27872c5", "hasContextLine": true}
{"type": "log", "items": ["info: probe-log-from-remix-loader"]}
recorder: [{"url":"/rec","sentryTrace":null,"baggage":null}]
```

That is the complete sink content: zero transaction and zero span envelopes, as recorded.

### Mode A - isolation (3 concurrent `/iso/{a,b,c}`) - CORRECT, as recorded

```
{"type": "event", "exception": "iso-error-a", "mechanism": "generic", "handled": true, "trace_id": "efb4d60dea1b4808af478b2e5e4ed88b", "tags": {"probe_tag": "tag-a"}}
{"type": "event", "exception": "iso-error-b", "mechanism": "generic", "handled": true, "trace_id": "3184bd3c4eda43b797d5f0ab7d0f0a44", "tags": {"probe_tag": "tag-b"}}
{"type": "event", "exception": "iso-error-c", "mechanism": "generic", "handled": true, "trace_id": "85d311442e6c460fb2fab9db14286700", "tags": {"probe_tag": "tag-c"}}
```

### Mode A - incoming trace - CORRECT, as recorded

```
{"type": "event", "exception": "probe-loader-boom-trace", "mechanism": "auto.function.remix.server", "handled": false, "sdk": "sentry.javascript.remix", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "bbbbbbbbbbbbbbbb", "hasContextLine": true}
recorder: [{"url":"/rec","sentryTrace":null,"baggage":null}]
```

### Mode B - `bun dist/server.js`

```
{"type": "transaction", "name": "GET users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "spans": ["function LOADER routes/users.$id"]}
{"type": "transaction", "name": "GET db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "spans": ["function LOADER routes/db", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET outfetch", "op": "http.server", "source": "route", "status": "ok", "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "spans": ["function LOADER routes/outfetch"]}
{"type": "event", "exception": "probe-loader-boom-7", "mechanism": "auto.function.remix.server", "handled": false, "sdk": "sentry.javascript.remix", "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "hasContextLine": false}
{"type": "transaction", "name": "GET boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "spans": ["function LOADER routes/boom.$id"]}
{"type": "log", "items": ["info: probe-log-from-remix-loader"]}
recorder: [{"url":"/rec","sentryTrace":null,"baggage":null}]
```

### Mode B - isolation - BROKEN, as recorded

```
{"type": "event", "exception": "iso-error-a", "handled": true, "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "tags": {"probe_tag": "tag-c"}}
{"type": "event", "exception": "iso-error-b", "handled": true, "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "tags": {"probe_tag": "tag-c"}}
{"type": "event", "exception": "iso-error-c", "handled": true, "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "tags": {"probe_tag": "tag-c"}}
{"type": "event", "message": "sentinel", "handled": true, "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "tags": {"probe_tag": "tag-c"}}
```

### Mode B - incoming trace - BROKEN, as recorded

```
{"type": "event", "exception": "probe-loader-boom-trace", "mechanism": "auto.function.remix.server", "handled": false, "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "tags": {"probe_tag": "tag-c"}, "hasContextLine": false}
{"type": "transaction", "name": "GET boom/:id", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "3122e6bcb0434709870d7c35e7683d7e", "spans": ["function LOADER routes/boom.$id"]}
```

### Match

Seven of eight capabilities match the record exactly, including the headline defect (Mode A has no
spans at all; Mode B has the full span tree but one process-global trace id, `tag-c` leaking onto
every later event, and the upstream `sentry-trace` ignored).

**One difference: outgoing fetch.** The recorder saw `sentryTrace: null, baggage: null` on every
run, in both modes, and Mode B's `GET outfetch` transaction contains only
`function LOADER routes/outfetch`, no `http.client` span. The record expected trace headers in
Mode A and a nested `http.client GET .../rec` span plus headers in Mode B. Everything else about
Mode B (route names, LOADER spans, mysql2 spans) is unchanged, so the bundle is instrumented; only
`fetch` is untouched. This machine now has bun 1.4.2 rather than the recorded 1.4.0, and the
sibling verification directory
`$REPRO/refutations/verify4-M-remix-bun-outgoingfetch/REPRO.md` already records that Bun publishes no undici
diagnostics channels and that plain-bun `fetch` needs `integrations: [fetchIntegration()]` from
`@sentry/bun` (plus the default `traceLifecycle: 'stream'`) to produce a span. The rebuild was run
once as recorded, with no extra integrations, so the difference is recorded rather than chased.

## Files

- `instrument.mjs` - `Sentry.init` (`traceLifecycle: 'static'`, `tunnel` from `SINK_URL`)
- `server.mjs` - `import './instrument.mjs'` first line, then `./db.mjs`, then the express adapter
- `db.mjs` - module-scope `mysql2` pool on 127.0.0.1:3307
- `build-server.ts` - `Bun.build` + `sentryBunPlugin()` -> `dist/server.js` (Mode B)
- `vite.config.ts` - `remix()` + `sentryRemixVitePlugin()`
- `app/entry.server.tsx` - `export const handleError = Sentry.sentryHandleError`
- `app/routes/` - `users.$id`, `boom.$id`, `iso.$id`, `db`, `log`, `outfetch`, `sentinel`
- `sink2.mjs` - envelope sink (`/__items`), extended with `tags` and `parent_span_id`
- `recorder.mjs` - echoes the `sentry-trace` / `baggage` of the incoming `/rec` request (`/__hits`)
- `modeA.log`, `modeB.log`, `sink.log`, `recorder.log`, `build.log`, `buildserver.log` - this run
