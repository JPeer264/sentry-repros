# M-solidstart-deno: SolidStart 2 (@solidjs/start 2.0.2, nitro 3.0.260610-beta, vite 8) on deno 2.9.0 running the node-server nitro build output (.output/server/index.mjs)

## What it reproduces

Key surprise: this combination works far better than expected, because @sentry/solidstart on develop does build-time (orchestrion) instrumentation inside the vite build. The Deno runtime never has to patch modules, so mysql2 db spans work with no @sentry/deno import hook and no --import flag. The server SDK is @sentry/node (index.server.js re-exports it) and its OTel setup boots cleanly under deno 2.9.0.

Two Deno-specific defects, both confirmed against a node control run of the exact same .output bundle:
1. Outgoing fetch: no http.client span and no propagation headers (known Deno finding K2), while node produces both.
2. Scope leak: the first Sentry.setTag in the process sticks to the shared default isolation scope and shows up on every later request that does not overwrite it. Node does not leak. Worth an issue: it means one request's tags/user/context can be attributed to unrelated later requests on Deno.

Two framework-level gaps that are NOT Deno's fault (node behaves the same):
- A throw from an API route handler never becomes a Sentry event; only the transaction turns internal_error. Users must wrap handlers themselves (or use withServerActionInstrumentation for 'use server' functions, which is what the e2e app solidstart-2 does).
- Route names are not parameterized: static gives "GET /api/users/42" with source url; stream gives just "GET". Same shape as the Bun/Nitro catch-all finding — the transaction carries the raw URL rather than the route pattern, so the name is high cardinality in static and useless in stream.

Packaging friction worth a docs line: npm refuses the install without --legacy-peer-deps because @sentry/nitro's peer range does not accept nitro 3.0.260610-beta (the version @solidjs/start 2.0.2 pulls); pnpm, which the e2e app uses, is more lenient.

Everything above is the develop build (10.67.0 tarballs from $S/pack); 10.73.0 was never installed. All processes I started were killed and app/node_modules was removed.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Build on node, run the output on Deno. No Deno-specific SDK package is involved: @sentry/solidstart pulls in @sentry/node and that runs on Deno.

1. Packages (npm, --legacy-peer-deps is required because @sentry/nitro's peer range `nitro@">=3.0.0-0 <4.0.0 || 3.0.260311-beta || 3.0.260415-beta"` does not accept nitro 3.0.260610-beta under npm's prerelease semver rules):
   npm install --legacy-peer-deps @solidjs/start@2.0.2 @solidjs/router solid-js@1.9.14 vite@^8 vite-plugin-solid nitro@3.0.260610-beta mysql2 \
     $S/pack/sentry-{solidstart,core,nitro,node,server-utils,server-runtime-injection,opentelemetry,solid,browser,browser-utils,replay,replay-canvas,feedback,bundler-plugins}-10.67.0.tgz

2. vite.config.ts:
   import { sentrySolidStart } from '@sentry/solidstart/vite';
   import { solidStart } from '@solidjs/start/config';
   import { nitro } from 'nitro/vite';
   export default defineConfig({ plugins: [solidStart({ appRoot: './src' }), sentrySolidStart({ sourcemaps: { disable: true } }), nitro({ serverDir: './server' })] });

3. Init placement: a Nitro startup plugin, server/plugins/sentry.ts:
   import * as Sentry from '@sentry/solidstart';
   import { definePlugin } from 'nitro';
   export default definePlugin(() => { Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static' }); });
   No --import preload, no instrument file: sentrySolidStart's orchestrion pass bakes the library instrumentation into the bundle at build time, which is exactly why mysql2 spans still work under Deno.

4. Build with node: NODE_ENV=production npx vite build  (NODE_ENV must be production, the plugin skips the orchestrion pass in development).
5. Run with Deno: PORT=<port> HOST=127.0.0.1 deno run -A .output/server/index.mjs  -> "➜ Listening on: http://127.0.0.1:<port>/".

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH

# deps (node_modules was deleted afterwards to save disk; rerun this to rebuild)
cd $S/deep/M-solidstart-deno/app
npm install --no-audit --no-fund --legacy-peer-deps
npm install --no-audit --no-fund --legacy-peer-deps $S/pack/sentry-solidstart-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-nitro-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-solid-10.67.0.tgz $S/pack/sentry-browser-10.67.0.tgz $S/pack/sentry-browser-utils-10.67.0.tgz $S/pack/sentry-replay-10.67.0.tgz $S/pack/sentry-replay-canvas-10.67.0.tgz $S/pack/sentry-feedback-10.67.0.tgz $S/pack/sentry-bundler-plugins-10.67.0.tgz

# sink + fetch recorder
PORT=47311 node $S/qs/sink.mjs > $S/deep/M-solidstart-deno/sink.log 2>&1 &
node $S/deep/M-solidstart-deno/recorder.mjs > $S/deep/M-solidstart-deno/recorder.log 2>&1 &

# build (node) and run (deno)
NODE_ENV=production npx vite build
PORT=52731 HOST=127.0.0.1 deno run -A .output/server/index.mjs        # static lifecycle
SENTRY_LIFECYCLE=stream PORT=52733 HOST=127.0.0.1 deno run -A .output/server/index.mjs
PORT=52732 HOST=127.0.0.1 node .output/server/index.mjs               # node control run

# probes
curl -s http://127.0.0.1:52731/api/error ; curl -s http://127.0.0.1:52731/api/users/42
curl -s "http://127.0.0.1:52731/api/iso?tag=alpha" & curl -s "http://127.0.0.1:52731/api/iso?tag=beta" & curl -s "http://127.0.0.1:52731/api/iso?tag=gamma" & wait
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1000000000000001-1" -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public" http://127.0.0.1:52731/api/ok
curl -s http://127.0.0.1:52731/api/fetchout ; curl -s http://127.0.0.1:52731/api/db ; curl -s http://127.0.0.1:52731/api/log ; curl -s http://127.0.0.1:52731/api/sentinel
curl -s http://127.0.0.1:47311/__items | python3 -m json.tool
curl -s http://127.0.0.1:47312/__hits
```

Files: `app/`, `deno-app.log`, `deno-app2.log`, `deno-app3.log`, `deno-nosentry.log`, `deno-stream.log`, `deno.pid`, `deno2.pid`, `deno3.pid`, `deno4.pid`, `node-app.log`, `node.pid`, `pids`, `recorder.log`, `recorder.mjs`, `run-a.log`, `sink.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | broken | An error thrown from an API route handler (src/routes/api/error.ts) never reaches Sentry: the request transaction arrives with status internal_error and the client gets HTTP 500, but no event envelope is produced (verified with a sentinel captureMessage that arrived afterwards). SolidStart/Nitro swallows the throw; this is not Deno-specific, the same .output under node behaves identically. Manual Sentry.captureException inside a handler works and the event carries request data, transaction name, stack frames with context lines and mechanism generic/handled=true. static lifecycle. |
| route names | broken | static lifecycle: the transaction for /api/users/42 is named "GET /api/users/42" with transaction_info.source = "url", i.e. the raw path, not the /api/users/:id route pattern (same on node, so it is a SolidStart/Nitro gap, not a Deno one). stream lifecycle is worse: the server span is named "GET" (method only) with no source attribute at all, so the path is gone entirely. |
| isolation | partial | Three concurrent /api/iso?tag=alpha/beta/gamma requests each produced an event with only its own tag and its own trace id. But the FIRST setTag in the process also lands on the shared default isolation scope, so every later request that does not set the tag itself inherits it: after the burst, /api/sentinel events kept reporting tags={'probe-tag':'alpha'} indefinitely. Reproduced after a restart with sequential requests (one, two, three): only the first tag ('one') leaks into later untagged requests. This is Deno-specific: the same .output run under node shows sentinel with tags=None. static lifecycle. |
| incoming trace | works | A request with sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1000000000000001-1 plus baggage produced a transaction with trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa and parent_span_id 1000000000000001. static lifecycle. |
| outgoing fetch | broken | A fetch from the handler to the local recorder produced no http.client span in the transaction, and the recorder received the request with no sentry-trace and no baggage header ({"url":"/recorder"}). Under node the identical build produces "http.client GET http://127.0.0.1:47312/recorder" and both headers, so this is the known Deno fetch gap (K2) surfacing through SolidStart unchanged. static and stream lifecycle both. |
| db spans | works | A module-scope mysql2 connection queried inside /api/db yields "db SELECT id, name FROM users" as a child span of the request transaction (static), and "db SELECT users" plus "db mysql2.connect" in stream lifecycle. Instrumentation path: build-time (orchestrion) instrumentation injected by sentrySolidStart's sentryOrchestrionPlugin during vite build; no Deno import hook and no @sentry/deno were used or needed, mysql2 is bundled into the server output. |
| logs | works | Sentry.logger.info('solidstart-deno log line') inside a handler arrived as a log envelope: {"type": "log", "items": ["info: solidstart-deno log line"]} after the usual ~5s flush timer. static lifecycle. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
DENO, traceLifecycle 'static' (sink /__items):

{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "fe27576383344938bb6a2f68ebbe568d", "sdk": "sentry.javascript.solidstart", "spans": ["http.server GET /api/error", "middleware GET /api/error", "http.server GET /api/error"]}
{"type": "transaction", "name": "GET /api/users/42", "op": "http.server", "source": "url", "status": "ok", "sdk": "sentry.javascript.solidstart", "spans": ["http.server GET /api/users/42", "middleware GET /api/users/42", "http.server GET /api/users/42"]}
{"type": "event", "message": "sentinel", ... }   <- arrived after /api/error, proving no error event was emitted

Isolation (three concurrent requests):
{"type": "event", "exception": "Error: iso-alpha", "trace_id": "7b204b64242f41628b4d6960150df71a", "tags": {"probe-tag": "alpha"}}
{"type": "event", "exception": "Error: iso-beta",  "trace_id": "cd882a4831e944feadd1a0ae6beab5d3", "tags": {"probe-tag": "beta"}}
{"type": "event", "exception": "Error: iso-gamma", "trace_id": "60e05f5085c54de09b1944251d339455", "tags": {"probe-tag": "gamma"}}
{"type": "event", "message": "sentinel", "trace_id": "9e59e7057aaf475cafc6cd0c71862d1b", "tags": {"probe-tag": "alpha"}}   <- leak

Leak after a fresh restart, sequential tag/sentinel pairs:
Error: iso-one   | tags= {'probe-tag': 'one'}
sentinel         | tags= {'probe-tag': 'one'}
Error: iso-two   | tags= {'probe-tag': 'two'}
sentinel         | tags= {'probe-tag': 'one'}
Error: iso-three | tags= {'probe-tag': 'three'}
sentinel         | tags= {'probe-tag': 'one'}

Incoming trace:
{"type": "transaction", "name": "GET /api/ok", "source": "url", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "1000000000000001"}

Outgoing fetch + db + logs:
{"type": "transaction", "name": "GET /api/fetchout", "spans": ["http.server GET /api/fetchout", "middleware GET /api/fetchout", "http.server GET /api/fetchout"]}     <- no http.client
recorder /__hits: [{"url":"/recorder"}]                                                                  <- no sentry-trace, no baggage
{"type": "transaction", "name": "GET /api/db", "spans": ["http.server GET /api/db", "middleware GET /api/db", "http.server GET /api/db", "db SELECT id, name FROM users"]}
{"type": "log", "items": ["info: solidstart-deno log line"]}

DENO, traceLifecycle 'stream' (same build):
SPAN ['middleware GET /api/users/42', 'http.server GET', 'http.server GET', 'http.server GET', 'db mysql2.connect'] | src= [None, None, None, None, None]
SPAN ['middleware GET /api/db', 'db SELECT users', 'http.server GET', 'http.server GET', 'http.server GET']
SPAN ['middleware GET /api/fetchout', 'http.server GET', 'http.server GET', 'http.server GET']

SAME .output UNDER NODE 26.5.0 (control run):
TX GET /api/error | source= url | spans= [...]                              <- also no error event, framework swallow is not Deno-specific
EVENT Error: iso-warm | tags= {'probe-tag': 'warm'}
EVENT sentinel | tags= None                                                 <- no tag leak on node
TX GET /api/fetchout | spans= [..., 'http.client GET http://127.0.0.1:47312/recorder']
recorder: {"url":"/recorder","sentryTrace":"6b181d11005842e0a120fbedb83b2b2e-a8f81ca0ab1f046d-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=6b181d11005842e0a120fbedb83b2b2e,sentry-sampled=true,..."}
TX GET /api/db | spans= [..., 'db SELECT id, name FROM users']
LOG ['info: solidstart-deno log line']

Viability check (build with no Sentry at all, run under deno): "➜ Listening on: http://127.0.0.1:52731/", /api/ok -> {"ok":true}, /api/users/42 -> {"id":"42"}, / -> full SSR HTML.
```

## Docs note

No page mentions the combination. ~/dev/sentry-docs/docs/platforms/javascript/guides/solidstart/ (index.mdx, install/, features/, profiling/) contains no occurrence of "deno" at all; the SolidStart guide has no getting-started-prerequisites include of its own (platform-includes/getting-started-prerequisites/ has javascript.solid.mdx but no javascript.solidstart.mdx), so it never states a supported runtime. Conversely docs/platforms/javascript/guides/deno/index.mdx:1-18 declares the Deno SDK (sentry.javascript.deno, beta) as a manual-setup server platform and names no framework anywhere in its 232 lines. So a user has nothing telling them that a SolidStart node-server build runs on Deno, nor that on Deno it loses outgoing-fetch tracing and leaks the first scope write.
