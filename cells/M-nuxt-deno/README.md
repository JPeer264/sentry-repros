# M-nuxt-deno — Nuxt 4.5.2 (Nitro `deno_server` preset) + @sentry/nuxt on Deno 2.9.0

## What it reproduces

Nuxt 4.5.2 (Nitro 2.13.4, h3 1.15.11) built with `nitro: { preset: 'deno_server' }` and served by
`deno run ... .output/server/index.mjs` on Deno 2.9.0, with `@sentry/nuxt` 10.67.0 (develop / v11 line,
`6f2da7483d`) initialized through `autoInjectServerSentry: 'top-level-import'`. Two things come out of it.
First, the install itself is broken: with a non-node preset the Nuxt module derives the entry filename from
`nitro.options.commands.preview` (`deno task --config .output/deno.json start`) with the regex
`/[^/\\]+\.[^/\\]+$/`, gets the literal string `deno.json start`, and writes
`import './sentry.server.config.mjs';\nundefined` into a file named `.output/server/deno.json start` while
leaving the real entry `.output/server/index.mjs` untouched — so Sentry never initializes unless you prepend
the import yourself. Second, once initialized by hand, the SDK reports errors and logs but is tracing-blind:
the `deno_server` preset serves through `Deno.serve`, which `@sentry/node`'s `node:http` instrumentation never
sees, so no request span exists, `getActiveSpan()` is undefined in a handler, one process-wide trace id is
reused for every event, incoming `sentry-trace` is ignored, outgoing `fetch` carries no propagation headers,
and no db span is produced. The Nuxt docs' recommended `--import ./.output/server/sentry.server.config.mjs`
flow has no Deno equivalent (`deno run` has no `--import`), so `top-level-import` is the only viable install
method here.

## Install

```
S=$SCRATCH
cd $REPRO/cells/M-nuxt-deno

npm install --no-audit --no-fund nuxt@4.5.2 vue mysql2 \
  $S/pack/sentry-nuxt-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-browser-10.67.0.tgz $S/pack/sentry-vue-10.67.0.tgz \
  $S/pack/sentry-browser-utils-10.67.0.tgz $S/pack/sentry-bundler-plugins-10.67.0.tgz \
  $S/pack/sentry-replay-10.67.0.tgz $S/pack/sentry-replay-canvas-10.67.0.tgz $S/pack/sentry-feedback-10.67.0.tgz
```

The same tarballs are mirrored in `$REPRO/_toolbox/pack`. Use npm, not
`deno add`: every `@sentry/*` tarball needs its transitive `@sentry/*@10.67.0` siblings passed on the same
command line.

`.output/` is checked in (8.5 MB, self-contained — it carries its own `.output/server/node_modules`, and the
top-level-import workaround is already applied to `.output/server/index.mjs`), so the app runs without
reinstalling. Reinstall only to rebuild after changing sources.

## Run

```
D=$REPRO/cells/M-nuxt-deno

# build (only after a source change; never pass --buildDir, it relocates .output and drops the deno preset)
cd $D && npx nuxt build

# work around the broken top-level-import injection (already applied in the checked-in .output)
cd $D && node -e "const fs=require('fs');const p='.output/server/index.mjs';const s=fs.readFileSync(p,'utf8');if(!s.startsWith(\"import './sentry.server.config.mjs';\"))fs.writeFileSync(p,\"import './sentry.server.config.mjs';\n\"+s)"

# sinks (sink.mjs is $S/qs/sink.mjs with event trace ids, tags, runtime and hasContextLine kept)
PORT=41711 node $D/sink.mjs > $D/sink.log 2>&1 &
PORT=41712 node $D/recorder.mjs > $D/recorder.log 2>&1 &

# app
cd $D/.output && PORT=41715 SINK_PORT=41711 RECORDER_PORT=41712 \
  deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs

# probes
A=http://127.0.0.1:41715
curl -s -o /dev/null -w '%{http_code}\n' $A/api/error            # -> 500
curl -s $A/api/users/42
curl -s -o /dev/null -w '%{http_code}\n' $A/api/users/boom       # -> 500, parameterized-route error
curl -s $A/api/trace                                             # getActiveSpan()
curl -s $A/api/manual                                            # manual startSpan pair
curl -s $A/api/fetchout
curl -s $A/api/db
curl -s $A/api/log
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
        -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=abc123" $A/api/error
( curl -s "$A/api/tag?tag=alpha" & curl -s "$A/api/tag?tag=beta" & curl -s "$A/api/tag?tag=gamma" & wait )
sleep 8 && curl -s $A/api/sentinel                               # sentinel gates the reads
curl -s http://127.0.0.1:41711/__items                           # envelopes
curl -s http://127.0.0.1:41712/__seen                            # headers on the outgoing fetch
```

`sentry.server.config.ts` runs `traceLifecycle: 'static'` by default; set `SENTRY_LIFECYCLE=stream` for the
stream lifecycle. MariaDB for `/api/db` is the running container on `127.0.0.1:3307` (root, no password, db
`app`, table `users`).

## Expected (recorded verdict, cells.json id `M-nuxt-deno`)

| capability | recorded verdict |
| --- | --- |
| errors | works |
| route names | broken (no transaction/span envelope for any request; `getActiveSpan()` undefined) |
| isolation | broken (all three tagged events carry the last tag and one process-wide trace id) |
| incoming trace | broken (`sentry-trace`/`baggage` headers ignored, no `parent_span_id`) |
| outgoing fetch | broken (no `http.client` span, no propagation headers) |
| db spans | broken (no injection path; `injected libraries=[]`) |
| logs | works |

Recorded evidence lines:

```
## errors
{"type":"event","exception":"nuxt-deno-boom","mechanism":"chained","handled":true,"sdk":"sentry.javascript.nuxt","runtime":{"name":"node","version":"v26.3.0"},"traceId":"8991806e4d9246c2bde0ae1409ebc746","transaction":"GET /api/error","hasContextLine":true}
(HTTP: error=500 -- the error is not swallowed)

## route names -- no server span at all
curl /api/trace  ->  {"name":null}
{"type":"event","exception":"users-route-boom","mechanism":"chained","handled":true,"sdk":"sentry.javascript.nuxt","traceId":"e986536201324b02b35166f722720bd9","transaction":"GET /api/users/boom","hasContextLine":true}
# zero transaction/span envelopes were received for any HTTP request across every run

## manual spans DO work (proves the tracing pipeline itself is alive)
{"type":"transaction","name":"manual-root","op":"probe.manual","source":"custom","status":"ok","traceId":"262056e7ad714572bdf10a7cdd588c0c","spans":["probe.child manual-child"]}

## isolation -- three concurrent tagged requests
{"tag":"beta","trace":"nospan"}{"tag":"alpha","trace":"nospan"}{"tag":"gamma","trace":"nospan"}
{"type":"event","exception":"iso-beta","...,"tags":{"probe_tag":"gamma"},"traceId":"8991806e4d9246c2bde0ae1409ebc746"}
{"type":"event","exception":"iso-alpha","...,"tags":{"probe_tag":"gamma"},"traceId":"8991806e4d9246c2bde0ae1409ebc746"}
{"type":"event","exception":"iso-gamma","...,"tags":{"probe_tag":"gamma"},"traceId":"8991806e4d9246c2bde0ae1409ebc746"}
Sentry Logger [log]: Patched h3 event handler. Created new isolation scope.
Sentry Logger [log]: Patched h3 event handler. Using existing isolation scope.
Sentry Logger [log]: Patched h3 event handler. Using existing isolation scope.

## incoming trace -- headers ignored
{"type":"event","exception":"nuxt-deno-boom","...,"traceId":"8991806e4d9246c2bde0ae1409ebc746","transaction":"GET /api/error"}
{"type":"event","message":"sentinel","...,"traceId":"8991806e4d9246c2bde0ae1409ebc746","transaction":"GET /api/error"}   # transaction name leaks across requests too

## outgoing fetch -- no span, no headers
-- fetchout: {"rec":{"recorded":true}}
-- recorder seen: [{"url":"/rec","sentryTrace":null,"baggage":null},{"url":"/rec","sentryTrace":null,"baggage":null}]

## db
-- db: {"error":true,"url":".../api/db","statusCode":500,"statusMessage":"Server Error","message":"Server Error"}
[Sentry] Bundler plugin ran, injected libraries=[]
[Sentry] Runtime hook registered, injected libraries=[]

## logs
{"type":"log","items":["info: hello-from-nuxt-deno"]}
```

## Observed on 2026-09-07

Rebuilt from scratch and run once. Every version matches the record: nuxt 4.5.2, nitropack 2.13.4, h3 1.15.11,
vue 3.5.42, mysql2 3.24.3, `@sentry/*` 10.67.0 from the develop tarballs, deno 2.9.0.

The install bug reproduces verbatim. After `npx nuxt build`:

```
$ ls .output/server/
'deno.json start'   index.mjs   sentry.server.config.mjs   chunks/  node_modules/  package.json

$ cat '.output/server/deno.json start'
import './sentry.server.config.mjs';
undefined
```

`.output/server/index.mjs` starts with the nitro process shim, not the Sentry import, so the app boots with no
Sentry until the workaround prepends it.

Boot log after the workaround (`app.log`):

```
Sentry Logger [log]: SDK initialized from ESM
Sentry Logger [log]: [Sentry] Runtime hook registered, injected libraries=[]
Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
Listening 0.0.0.0:41715
Sentry Logger [log]: Patched h3 event handler. Created new isolation scope.
Sentry Logger [log]: Patched h3 event handler. Using existing isolation scope.
Sentry Logger [log]: Patched h3 event handler. Using existing isolation scope.
```

HTTP responses:

```
-- error http: 500
-- users/42: {"id":"42"}
-- users/boom http: 500
-- trace: {"name":null}
-- manual: {"manual":true}
-- fetchout: {"rec":{"recorded":true}}
-- db: {"error":true,"url":"http://127.0.0.1:41715/api/db","statusCode":500,"statusMessage":"Server Error","message":"Server Error"}
-- log: {"logged":true}
-- incoming trace http: 500
-- isolation: {"tag":"alpha","trace":"nospan"}{"tag":"beta","trace":"nospan"}{"tag":"gamma","trace":"nospan"}
```

Full sink dump (`items.txt`), static lifecycle:

```
{"type": "event", "exception": "Error: nuxt-deno-boom", "mechs": ["Error:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/error", "runtime": {"name": "node", "version": "v26.3.0"}, "hasContextLine": true}
{"type": "event", "exception": "Error: users-route-boom", "mechs": ["Error:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/users/boom", "runtime": {"name": "node", "version": "v26.3.0"}, "hasContextLine": true}
{"type": "transaction", "name": "manual-root", "op": "probe.manual", "source": "custom", "status": "ok", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "spans": ["probe.child manual-child"]}
{"type": "event", "exception": "TypeError: genFunc$1 is not a function", "mechs": ["TypeError:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/db", "runtime": {"name": "node", "version": "v26.3.0"}, "hasContextLine": true}
{"type": "event", "exception": "Error: nuxt-deno-boom", "mechs": ["Error:chained/handled=true", "Error:auto.function.nuxt.nitro/handled=false"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/error", "runtime": {"name": "node", "version": "v26.3.0"}, "hasContextLine": true}
{"type": "event", "exception": "Error: iso-gamma", "mechs": ["Error:generic/handled=true"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/error", "tags": {"probe_tag": "gamma"}, ...}
{"type": "event", "exception": "Error: iso-alpha", "mechs": ["Error:generic/handled=true"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/error", "tags": {"probe_tag": "gamma"}, ...}
{"type": "event", "exception": "Error: iso-beta", "mechs": ["Error:generic/handled=true"], "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/error", "tags": {"probe_tag": "gamma"}, ...}
{"type": "log", "items": ["info: hello-from-nuxt-deno"]}
{"type": "event", "message": "sentinel", "sdk": "sentry.javascript.nuxt", "trace_id": "4e7182cb4d514b76aa7379fe509fc854", "transaction": "GET /api/error", "tags": {"probe_tag": "gamma"}, ...}

recorder: [{"url":"/rec","sentry-trace":null,"baggage":null}]
```

Match per capability:

| capability | recorded | observed 2026-09-07 | match |
| --- | --- | --- | --- |
| errors | works | works: `/api/error` and `/api/users/boom` both 500, both events arrive with `hasContextLine: true`, sdk `sentry.javascript.nuxt`, runtime `node v26.3.0` | yes |
| route names | broken | broken: `/api/trace` -> `{"name":null}`, zero transaction/span envelopes for any HTTP request; the only transaction in the dump is the manual `manual-root` pair, which still works | yes |
| isolation | broken | broken: all three concurrent events carry `probe_tag: gamma`, one process-wide trace id `4e7182cb…`, and the stale transaction `GET /api/error`; debug log shows one "Created new isolation scope" and "Using existing isolation scope" for every later request | yes |
| incoming trace | broken | broken: the request with `sentry-trace: aaaa…-bbbb…-1` produced `trace_id 4e7182cb…` (the process-wide id) and no `parent_span_id` | yes |
| outgoing fetch | broken | broken: recorder saw `sentry-trace: null, baggage: null`, no `http.client` span anywhere in the dump | yes |
| db spans | broken | broken: `[Sentry] Bundler plugin ran, injected libraries=[]` and `[Sentry] Runtime hook registered, injected libraries=[]`, no db span; `/api/db` 500s exactly as recorded | yes |
| logs | works | works: `{"type": "log", "items": ["info: hello-from-nuxt-deno"]}` after the flush timer | yes |

All seven capabilities match the recorded verdict.

One detail the record left implicit: the `/api/db` 500 is
`TypeError: genFunc$1 is not a function` from inside the bundled `mysql2`, i.e. rollup's CJS interop handing
`generate-function` back as a namespace object. That failure happens in the driver before any Sentry code runs,
so it is a nitro/rollup bundling problem, not the reason the db span is missing — `injected libraries=[]` is.
The same failure was recorded in the sibling cell `M-nuxt-bun`.
