# M-sveltekit-bun

## What it reproduces

SvelteKit 2.70.3 (svelte 5, `sv create` minimal template, `@sveltejs/adapter-node` 5.5.7, vite 8 /
rolldown) with `@sentry/sveltekit` 10.67.0 (the `develop` / v11 line, built from
`getsentry/sentry-javascript@6f2da7483d`) running the adapter-node server output under
`bun build/index.js`. The app is API-routes-only and exercises seven server-side capabilities through an
envelope sink and a local fetch recorder: an unhandled error in a `+server.ts` endpoint, parameterized
route names, isolation-scope separation across three concurrent requests, incoming `sentry-trace`
continuation, outgoing `fetch` instrumentation, `mysql2` database spans from a module-scope pool, and
`Sentry.logger` log envelopes. `node build/index.js` runs the identical `build/` directory as a control.
Two wiring details are load-bearing on `develop`: the Vite plugin lives on the `@sentry/sveltekit/vite`
subpath (the docs' `import { sentrySvelteKit } from "@sentry/sveltekit"` throws
`does not provide an export named 'sentrySvelteKit'`), and tracing needs
`experimental.instrumentation.server: true` plus `src/instrumentation.server.ts` — calling `Sentry.init()`
from `hooks.server.ts` the old way emits no transaction or span envelopes at all.

## Install

```
cd $REPRO/cells/M-sveltekit-bun
npm install --no-audit --no-fund
```

`package.json` pins every `@sentry/*` package to the 10.67.0 tarball in `../../_toolbox/pack/` (the
durable mirror of `$S/pack`), so one `npm install` restores the whole tree. Use `npm`, not `bun add`:
`bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps. `@sentry/bundler-plugins`,
`@sentry/browser-utils`, `@sentry/replay`, `@sentry/replay-canvas` and `@sentry/feedback` are required
even though nothing imports them directly; without the packed `@sentry/browser-utils` the client build
dies with `"getComponentName" is not exported by @sentry/browser-utils`. `@sveltejs/kit` is pinned to
`2.70.3` and `mysql2` to `3.24.3` to match the record.

## Run

```
D=$REPRO/cells/M-sveltekit-bun
cd $D

# sink + fetch recorder
PORT=41337 node sink.mjs     > sink.log     2>&1 &  SINK=$!
PORT=41339 node recorder.mjs > recorder.log 2>&1 &  REC=$!

npx vite build

SENTRY_TUNNEL=http://127.0.0.1:41337/ RECORDER=http://127.0.0.1:41339 \
  SENTRY_LIFECYCLE=stream SENTRY_DEBUG=1 PORT=41344 \
  bun build/index.js > app-bun-stream.log 2>&1 &  APP=$!

B=http://127.0.0.1:41344
curl -s $B/api/boom                                   # errors
curl -s $B/api/users/42                               # route name
curl -s $B/api/db                                     # db spans
curl -s $B/api/out                                    # outgoing fetch
curl -s $B/api/log                                    # logs
curl -s $B/api/dcinfo                                 # diagnostics-channel subscriber flags
curl -s $B/api/acs                                    # AsyncLocalStorage sanity check
for t in alpha bravo charlie; do curl -s "$B/api/tag?t=$t" & done; wait   # isolation
curl -s -H 'sentry-trace: cccccccccccccccccccccccccccccccc-dddddddddddddddd-1' \
        -H 'baggage: sentry-trace_id=cccccccccccccccccccccccccccccccc,sentry-public_key=abc123,sentry-sampled=true' \
        $B/api/users/77                               # incoming trace
curl -s $B/ | grep -o '<meta name="sentry-trace"[^>]*'  # SSR trace meta tags
curl -s $B/api/sentinel                               # sentinel, then wait for it in the sink

curl -s http://127.0.0.1:41337/__items | python3 -m json.tool
curl -s http://127.0.0.1:41339/__seen  | python3 -m json.tool

# static lifecycle variant (transaction envelopes with nested spans[])
SENTRY_LIFECYCLE=static ... PORT=41345 bun build/index.js

# node control on the very same build/
SENTRY_LIFECYCLE=static ... PORT=41346 node build/index.js

kill $APP; kill $SINK; kill $REC
```

## Expected

Recorded verdicts (record id `M-sveltekit-bun` in `_records/cells.json`):

| capability | recorded verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** — no `http.client` span, no `sentry-trace`/`baggage` on the wire |
| db spans | **broken** — module-scope `mysql2/promise` pool produces no `db` span |
| logs | works |
| client errors | not-run (server-runtime probe, no browser) |

Recorded evidence lines:

```
### bun 1.4.0, documented wiring (instrumentation.server.ts), traceLifecycle 'stream'
{"type":"span","items":["function | sveltekit.resolve | src=- | route=/api/users/[id] | trace=cccccccccccccccccccccccccccccccc | parent=a65ca0eaa445189e","http.server | GET /api/users/[id] | src=route | route=/api/users/[id] | trace=cccccccccccccccccccccccccccccccc | parent=dddddddddddddddd"]}
{"type":"span","items":["function | sveltekit.resolve | src=- | route=/api/out | trace=e82e8c9bd5f34935bb740f3f77d45419 | parent=a9b5dc392ef70aef","http.server | GET /api/out | src=route | route=/api/out | trace=e82e8c9bd5f34935bb740f3f77d45419 | parent=-"]}
{"type":"span","items":["function | sveltekit.resolve | src=- | route=/api/db | trace=e42cc26caf9242f980336a4a9b537ef0 | parent=b6c7e2846e58cd24","http.server | GET /api/db | src=route | route=/api/db | trace=e42cc26caf9242f980336a4a9b537ef0 | parent=-"]}
{"type":"log","items":["info: sveltekit-bun-log-line"]}
=== rec ===
[{"url":"/__rec/from-sveltekit","sentry-trace":null,"baggage":null,"traceparent":null}]

### bun, isolation (3 concurrent /api/tag)
{"type":"event","exception":"iso-bravo","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"probe_tag":"bravo"},"transaction":"GET /api/tag","trace_id":"2da836ba23934520b80eeda7afff2d4a","parent_span_id":"842f6caeebde1eec"}
{"type":"event","exception":"iso-charlie","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"probe_tag":"charlie"},"transaction":"GET /api/tag","trace_id":"93c7bd93e6854d368279715d73bb02fa","parent_span_id":"a1408a78e03ab225"}
{"type":"event","exception":"iso-alpha","mechanism":"generic","handled":true,"sdk":"sentry.javascript.sveltekit","tags":{"probe_tag":"alpha"},"transaction":"GET /api/tag","trace_id":"7a226ef7dc97491fbb4085a6c79580d8","parent_span_id":"a8181952fe74fc14"}

### bun, error
{"type":"event","exception":"sveltekit-bun-boom","mechanism":"auto.function.sveltekit.handle_error","handled":false,"sdk":"sentry.javascript.sveltekit","transaction":"GET /api/boom","trace_id":"fecd25fba6db4a21b3fbbb31e871411f","parent_span_id":"8ebfd60cc15168ce","url":"https://127.0.0.1:41341/api/boom","hasContextLine":true}

### bun, traceLifecycle 'static' (same wiring)
{"type":"transaction","name":"GET /api/users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"844d3500c5c24edd9f2d62e74daa2330","http_route":"/api/users/[id]","spans":["function sveltekit.resolve"]}
{"type":"transaction","name":"GET /api/db","op":"http.server","source":"route","status":"ok","trace_id":"f74807052c35427f8fe3ae0aad91b8a0","http_route":"/api/db","spans":["function sveltekit.resolve"]}
{"type":"transaction","name":"GET /api/out","op":"http.server","source":"route","status":"ok","trace_id":"37803cfd654345ce94808fd33accf842","http_route":"/api/out","spans":["function sveltekit.resolve"]}
```

The recorded root cause for the two broken capabilities: `diagnosticsChannel.channel('undici:request:create').hasSubscribers`
is `false` on bun and `true` on node for the identical build, and `tracingChannel('mysql2:query').start.hasSubscribers`
is likewise `false` on bun / `true` on node, so `@sentry/node`'s `NodeFetch` and `Mysql2` integrations never
attach. The failure is silent unless `debug: true` is on, where it shows as one line:
`No available Node API to register diagnostics-channel injection hooks; skipping.`

## Observed on 2026-09-07

Rebuilt from the recorded setup and run once, on the three lifecycles the record used (bun/stream,
bun/static, node/static control). Environment drift from the record: the machine's `bun` is now
**1.4.2** (the record says 1.4.0; no 1.4.0 binary is on this machine). Everything else resolved to the
recorded versions: kit 2.70.3, vite 8.2.2, svelte 5.57.0, adapter-node 5.5.7, mysql2 3.24.3,
`@sentry/sveltekit` 10.67.0.

Verbatim sink items, bun 1.4.2, `traceLifecycle: 'stream'`:

```
{"type": "event", "exception": "Error: sveltekit-bun-boom", "mechanism": "auto.function.sveltekit.handle_error", "handled": false, "hasContextLine": true, "url": "https://127.0.0.1:41344/api/boom", "sdk": "sentry.javascript.sveltekit", "sdkVersion": "10.67.0", "runtime": {"name": "node", "version": "v26.3.0"}, "trace_id": "95b44278121f410fa504fcc4aae446f3", "parent_span_id": "945ae6f8b44c1341", "transaction": "GET /api/boom"}

{"type": "span", "trace_id": "34e5b4d7b59e4202b2aa494c566a88de", "items": ["function sveltekit.resolve", "http.server GET /api/users/[id]"], "raw": [{"name": "sveltekit.resolve", "parent_span_id": "83699928fac4e175", "is_segment": false, "op": "function", "origin": "auto.http.sveltekit", "http_route": "/api/users/[id]"}, {"name": "GET /api/users/[id]", "is_segment": true, "op": "http.server", "origin": "auto.http.sveltekit", "segment_source": "route", "http_route": "/api/users/[id]"}]}

{"type": "event", "exception": "Error: iso-charlie", "mechanism": "generic", "handled": true, "trace_id": "07f5168382b143dcb1bd2a30acdfdc84", "parent_span_id": "880d37493375e04b", "transaction": "GET /api/tag", "tags": {"probe_tag": "charlie"}}
{"type": "event", "exception": "Error: iso-alpha", "mechanism": "generic", "handled": true, "trace_id": "27684cd23dbe481882d530171529fe9e", "parent_span_id": "80b0a85879438c86", "transaction": "GET /api/tag", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-bravo", "mechanism": "generic", "handled": true, "trace_id": "9966a5c08fcd477cb221f79d04f3d4a2", "parent_span_id": "bcb2d2cf6a1ae6e7", "transaction": "GET /api/tag", "tags": {"probe_tag": "bravo"}}

{"type": "span", "trace_id": "cccccccccccccccccccccccccccccccc", "items": ["function sveltekit.resolve", "http.server GET /api/users/[id]"], "raw": [{"name": "sveltekit.resolve", "trace_id": "cccccccccccccccccccccccccccccccc", "parent_span_id": "809d3e49d67421e9", "is_segment": false}, {"name": "GET /api/users/[id]", "trace_id": "cccccccccccccccccccccccccccccccc", "parent_span_id": "dddddddddddddddd", "is_segment": true, "op": "http.server", "segment_source": "route", "http_route": "/api/users/[id]"}]}

<meta name="sentry-trace" content="d5cfe936f2ee4c24a7968a841f37c0c0-845b64b715148159-1"
<meta name="baggage" content="sentry-environment=production,sentry-public_key=abc,sentry-trace_id=d5cfe936f2ee4c24a7968a841f37c0c0,sentry-org_id=1,sentry-transaction=GET%20%2F,sentry-sampled=true,sentry-sample_rand=0.7700326188984963,sentry-sample_rate=1"

{"type": "span", "trace_id": "dd5f7bab71db44019861051aba270920", "items": ["function sveltekit.resolve", "http.server GET /api/out"]}
recorder /__seen: [{"url":"/__rec/from-sveltekit","sentry-trace":null,"baggage":null}]

{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"subs":false}
{"type": "span", "trace_id": "0f1055b4f1c94400a9cac4908547d326", "items": ["function sveltekit.resolve", "http.server GET /api/db"]}

/api/dcinfo -> {"undiciRequestCreate":false,"mysql2Query":false,"httpClientRequestCreated":true}
/api/acs    -> {"inside":"value-in-als","outside":null}
app-bun-stream.log:1: Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.

{"type": "log", "items": ["info: sveltekit-bun-log-line"]}
```

bun 1.4.2, `traceLifecycle: 'static'`:

```
{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"subs":false}
{"type": "transaction", "name": "GET /api/boom", "op": "http.server", "source": "route", "status": "ok", "trace_id": "5e2cb1025c94431c887e0bea86d0bfc2", "http_route": "/api/boom", "spans": ["function sveltekit.resolve"]}
{"type": "transaction", "name": "GET /api/users/[id]", "op": "http.server", "source": "route", "status": "ok", "trace_id": "c0f8de0e43374f78a4c635531e9537ce", "http_route": "/api/users/[id]", "spans": ["function sveltekit.resolve"]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "9ebab0a9bac7448ab1be8815e8ce9c48", "http_route": "/api/db", "spans": ["function sveltekit.resolve"]}
{"type": "transaction", "name": "GET /api/out", "op": "http.server", "source": "route", "status": "ok", "trace_id": "a38de3d9820f4084b2cc88beeb695bf8", "http_route": "/api/out", "spans": ["function sveltekit.resolve"]}
{"type": "log", "items": ["info: sveltekit-bun-log-line"]}
recorder /__seen: [{"url":"/__rec/from-sveltekit","sentry-trace":null,"baggage":null}]
```

node v26.5.0 control, identical `build/`, `traceLifecycle: 'static'`:

```
{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"subs":true}
/api/dcinfo -> {"undiciRequestCreate":true,"mysql2Query":true,"httpClientRequestCreated":true}
{"type": "transaction", "name": "GET /api/db", "spans": ["function sveltekit.resolve", "db mysql2.pool.connect", "db mysql2.connect", "db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /api/out", "spans": ["function sveltekit.resolve", "http.client GET http://127.0.0.1:41339/__rec/from-sveltekit"]}
recorder /__seen: [{"url":"/__rec/from-sveltekit","sentry-trace":"0084e93a3e7b44c298f2f286b638575b-bdf6a3062579e13a-1","baggage":"sentry-environment=production,sentry-public_key=abc,sentry-trace_id=0084e93a3e7b44c298f2f286b638575b,sentry-org_id=1,sentry-transaction=GET%20%2Fapi%2Fout,sentry-sampled=true,sentry-sample_rand=0.3597176411885701,sentry-sample_rate=1"}]
```

### Match against the record

| capability | recorded | observed | match |
| --- | --- | --- | --- |
| errors | works | works | yes |
| route names | works | works | yes |
| isolation | works | works | yes |
| incoming trace | works | works | yes |
| outgoing fetch | broken | broken | yes |
| db spans | broken | broken | yes |
| logs | works | works | yes |
| client errors | not-run | not-run | yes |

All eight verdicts reproduce, on bun 1.4.2 rather than the recorded 1.4.0. Both setup facts the record
calls out also reproduce: `sentrySvelteKit` is only on the `@sentry/sveltekit/vite` subpath, and the
`experimental.instrumentation.server` + `src/instrumentation.server.ts` wiring is what makes any span
envelope appear at all.

The recorded root cause holds verbatim. `/api/dcinfo` reads the subscriber flags straight out of the
route: on bun both `undici:request:create` and `mysql2:query` report `hasSubscribers: false`, on node
both report `true`, from the same `build/` directory. The node control on that same build emits the
three `db` spans and the `http.client` span with `sentry-trace` and `baggage` on the wire, so the
SvelteKit build and the Vite plugin injection are not the problem — the runtime is. The one debug line
the record names is the only warning bun prints:
`No available Node API to register diagnostics-channel injection hooks; skipping.`

### Files left behind

`build/` (4.7 MB) and `.svelte-kit/` (1.7 MB) are the recorded build output, kept so the app runs
without a rebuild; both are well under the 50 MB threshold. `node_modules` was removed after the run —
the Install line restores it. `sink.log`, `recorder.log`, `app-bun-stream.log`, `app-bun-static.log`,
`app-node-static.log`, `items-stream.json`, `items-static.json`, `items-node-static.json`,
`rec-stream.json`, `rec-node-static.json` and the `*.pid` files are this run's raw output, kept as the
evidence behind the tables above.
