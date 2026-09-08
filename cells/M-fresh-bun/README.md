# M-fresh-bun: Fresh 2 (@fresh/core 2.3.3, Vite-based, scaffolded with jsr:@fresh/init@2) on bun 1.4.0 (build step run with deno 2.9.0)

## What it reproduces

Key findings a docs page would have to carry:

1. Fresh 2 on bun is real and needs no shim. The Vite SSR build emits `_fresh/server.js` as
   `export default { fetch }` with zero bare imports, which is exactly Bun.serve's entry shape.
   Deno is only a build-time dependency. `Deno.serve` in the bundle sits inside `app.listen()`,
   which the default export never calls. The Deno-only bits that DO remain on a hot path are
   `Deno.stat`/`Deno.open` in Fresh's static-file serving, so `/assets/*` under bun is the one
   thing I would expect to break; I did not exercise it (the HTML references the asset, I only
   asserted on the SSR HTML and the route handlers).

2. Installing the SDK is the non-obvious step. The Fresh app dir's node_modules is Deno-managed
   (`nodeModulesDir: "manual"`, no package.json), and `npm install` there prunes the Vite/preact
   tree the build needs. Putting node_modules one directory ABOVE the app works because bun
   resolves bare specifiers by walking up from app/_fresh/server/assets/*.js. A docs page should
   either say that, or tell users to add a real package.json to the Fresh app.

3. @sentry/bun and the db driver must be `ssr.external` in vite.config.ts. If they are bundled
   into server-entry.js, Sentry.init in the bundle would run a second copy of the SDK and the
   diagnostics-channel injection has nothing to hook.

4. Both defects here are "framework has no Sentry integration" defects, and both have the same
   one-middleware fix, which is what a Fresh guide would need to ship:
   - Fresh swallows route-handler throws entirely (500 page, span status internal_error, no event).
   - The Bun.serve span is named from the raw URL (`GET /users/42`, source url), never from the
     matched pattern. Fresh does expose `ctx.route` (= "/users/:id"), so the data is available.
   Note the source inconsistency after `updateSpanName`: stream lifecycle reports source "route",
   static lifecycle reports "custom", and setting `sentry.source` back to "route" after
   updateSpanName does not stick in static.

5. Contradicts the standing Bun note that library spans need a `Bun.build` + `sentryBunPlugin`
   bundle: mysql2 spans came through on plain `bun entry.ts` with origin
   auto.db.mysql2.diagnostic_channel. What mattered was module-scope pool creation reached from
   the server entry (app/dbpool.ts imported by main.ts), not a build-time plugin. Worth
   re-checking on the plain Bun/express template, since it changes the recommended setup.

6. One transient during the very first bun run: `/api/:name` 404'd on the first request after
   boot while `/` succeeded, and the request never reached the logger middleware. It did not
   reproduce on any later run (same bundle, same command). Likely a race between Bun's server
   accepting connections and Fresh's lazy fs-route module import; I did not chase it further and
   would not report it as a finding without a repro.

Cleanup: sink (86385), recorder (86434) and all three app processes (87155, 94101, 95878) were
killed; node_modules removed from both app/ and the probe dir (the probe dir is now 688K).
No 10.73.0 was installed; everything ran against the $S/pack 10.67.0 develop tarballs.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Fresh 2 builds with Deno/Vite but the built server runs on bun unchanged. Exact wiring:

1. Scaffold + build with deno (deno is only a build-time tool here):
   `deno run -A -r jsr:@fresh/init@2 ./app --force --tailwind`
   `cd app && deno task build`  ->  `_fresh/server.js` which is literally
   `import server from "./server/server-entry.mjs"; export default { fetch: server.fetch };`
   The SSR bundle has zero bare imports by default, so bun needs nothing from Deno at runtime.
   Only `Deno.serve` (used by `app.listen()`, not by the default export), `Deno.stat`/`Deno.open`
   (static-file serving) and `Deno.readTextFileSync` (error code frames, inside try/catch) survive
   in the bundle, so the `fetch` path is Deno-free.

2. Keep the SDK and the db driver out of the SSR bundle so bun resolves them at runtime.
   app/vite.config.ts:
     export default defineConfig({
       plugins: [fresh(), tailwindcss()],
       ssr: { external: ["@sentry/bun", "mysql2", "mysql2/promise"] },
       build: { rollupOptions: { external: [/^@sentry\//, /^mysql2/] } },
     });

3. Install the SDK in the PARENT directory of the Fresh app (not in app/, whose node_modules is
   Deno-managed and gets pruned by npm). Bun resolves bare imports by walking up from the bundled
   file at app/_fresh/server/assets/*.js, so a node_modules one level above app/ is found:
     npm install $S/pack/sentry-bun-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz \
       $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz \
       $S/pack/sentry-server-runtime-injection-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz mysql2

4. instrument.ts (parent dir):
     import * as Sentry from "@sentry/bun";
     Sentry.init({ dsn, tunnel: "http://127.0.0.1:<sink>/", tracesSampleRate: 1.0, traceLifecycle: "stream"|"static" });

5. entry.ts (parent dir) - init first, then the Fresh bundle, then Bun.serve:
     import "./instrument.ts";
     import server from "./app/_fresh/server.js";
     Bun.serve({ port, fetch: (req: Request) => server.fetch(req) });

6. Run: `bun entry.ts`. No `Bun.build` / `sentryBunPlugin` step was needed (see db spans).

Baseline check without Sentry: `PORT=41340 bun app/_fresh/server.js` boots ("Started development
server: http://localhost:41340"), SSRs `/` and serves fs routes and `app.get()` routes identically
to `deno serve -A _fresh/server.js`. Static assets under /assets are the one thing that would need
Deno.stat/Deno.open; the HTML references them but I did not exercise them.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
cd $S/deep/M-fresh-bun

# scaffold (already done; app/ is checked in under the probe dir minus node_modules)
deno run -A -r jsr:@fresh/init@2 ./app --force --tailwind --vscode

# deps: SDK + driver go in the PARENT dir so bun's upward lookup finds them from app/_fresh/**
npm install --no-audit --no-fund \
  $S/pack/sentry-bun-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $S/pack/sentry-opentelemetry-10.67.0.tgz mysql2

# deno deps for the build only
(cd app && deno install)

# build (deno + vite)
(cd app && deno task build)

# sink + recorder
PORT=41411 node $S/qs/sink.mjs > sink.log 2>&1 &
PORT=41413 node recorder.mjs > rec.log 2>&1 &

# run Fresh on bun
SINK_PORT=41411 RECORDER_PORT=41413 PORT=41412 LIFECYCLE=static bun entry.ts > app.log 2>&1 &
# (LIFECYCLE=stream for the span-envelope run)

# drive it from a plain curl process
curl -s -X DELETE http://127.0.0.1:41411/__items
curl -s http://127.0.0.1:41412/users/42
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:41412/boom
(curl -s http://127.0.0.1:41412/iso/alpha & curl -s http://127.0.0.1:41412/iso/beta & curl -s http://127.0.0.1:41412/iso/gamma & wait)
curl -s http://127.0.0.1:41412/fetchout
curl -s http://127.0.0.1:41412/db
curl -s http://127.0.0.1:41412/log
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
        -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1' \
        http://127.0.0.1:41412/trace
curl -s http://127.0.0.1:41412/sentinel   # sentinel, wait for it in the sink
sleep 8; curl -s http://127.0.0.1:41411/__items
curl -s http://127.0.0.1:41413/__seen

# viability baseline without Sentry
(cd app && PORT=41340 bun _fresh/server.js)
(cd app && deno serve -A --port 41338 _fresh/server.js)
```

Files: `app/`, `app.log`, `app2.log`, `app3.log`, `bunapp.log`, `bunapp2.log`, `bunapp3.log`, `denoapp.log`, `entry.ts`, `instrument.ts`, `package-lock.json`, `package.json`, `pids.txt`, `rec.log`, `recorder.mjs`, `sink.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | partial | Out of the box a throw in a Fresh route handler does NOT reach Sentry: Fresh catches it, logs it to stderr and renders its own 500 page. The Bun.serve span still ends with status internal_error, but no event envelope is produced. Adding a Fresh middleware that wraps ctx.next() in try/catch and calls Sentry.captureException fixes it, giving mechanism 'fresh.middleware', handled:false, with request data and context lines attached. Both results from traceLifecycle 'static'. |
| route names | partial | Out of the box the server span is named from the URL: name 'GET /users/42', source 'url' (origin auto.http.bun.serve) - the Bun.serve integration has no idea Fresh matched /users/:id. Fresh exposes the matched pattern as ctx.route, so a middleware calling Sentry.updateSpanName(getRootSpan(span), `${ctx.req.method} ${ctx.route}`) yields 'GET /users/:id'; in traceLifecycle 'stream' the span then reports source 'route', in 'static' the transaction reports source 'custom' (updateSpanName forces custom and a later setAttribute('sentry.source','route') does not win). |
| isolation | works | Three concurrent GETs to /iso/alpha/beta/gamma, each doing Sentry.setTag before and after a randomised 50-150ms await, then captureException. Each event carried exactly its own tags ({probe_tag, probe_tag_after} both equal to its own name) and its own trace id, matching the trace id the handler read back from the active span. traceLifecycle 'static'. |
| incoming trace | works | curl with sentry-trace: aaaa...aaaa-bbbbbbbbbbbbbbbb-1 and a matching baggage header produced a transaction with trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa and parent_span_id bbbbbbbbbbbbbbbb; the captureMessage inside the handler landed on the same trace id, and Sentry.getActiveSpan() was set inside the route handler. traceLifecycle 'static'. |
| outgoing fetch | works | A plain global fetch() from inside a Fresh route handler to a local recorder produced an http.client span (origin auto.http.fetch; 'http.client GET http://127.0.0.1:41413/rec' in static, 'http.client GET 127.0.0.1' in stream) as a child of the http.server segment, and the recorder saw sentry-trace with the same trace id plus a full baggage header including sentry-sampled=true. |
| db spans | works | mysql2 spans appeared with NO Bun plugin build: plain `bun entry.ts`, instrumentation path is the runtime diagnostics-channel injection (origin auto.db.mysql2.diagnostic_channel). The requirement is only that mysql2 stays external to the Vite SSR bundle and that the pool is created at module scope - I put createPool in app/dbpool.ts and imported it from main.ts so it evaluates at server startup, avoiding K11. Spans: 'db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT id, name FROM users' (static) / 'db SELECT users' (stream), all children of the http.server segment. This refines the toolbox note that Bun library spans need a Bun.build + sentryBunPlugin bundle; here they did not. |
| logs | works | Sentry.logger.info('fresh-bun-log-probe', { where: 'route-handler' }) inside a route handler arrived as a log envelope after ~7s: {"type":"log","items":["info: fresh-bun-log-probe"]}. No enableLogs option needed on develop. |
| client errors | not-run | Only the server side was probed. Fresh's client entry is a Vite-built preact island bundle, so @sentry/browser would have to be added to app/client.ts; not attempted inside the time box. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
--- baseline, no Sentry middleware, traceLifecycle 'static' (errors + route names) ---
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"1a433ac3c6b447678aeede1edcae7ee7","sdk":"sentry.javascript.bun","spans":[]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"7f18f9071034463193087b714e85d277","sdk":"sentry.javascript.bun","spans":[]}
   ^ /boom returned HTTP 500 and NO event envelope followed it; the next envelope was the sentinel:
{"type":"event","message":"sentinel",...,"trace_id":"d570bf79d33641709450609a2b7038f2"}

--- with the Sentry Fresh middleware, traceLifecycle 'static' (errors + route names) ---
ctx keys: config,url,req,route,params,state,data,error,info,isPartial,next,Component route: /users/:id
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"custom","status":"ok","trace_id":"867e105a531f420a8e7c17bb51f58a45"}
{"type":"event","exception":"Error: fresh-bun-route-boom","mechanism":"fresh.middleware","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"trace_id":"02580a07e57e40c99464b9ad4963d79e","request":{"url":"http://127.0.0.1:41412/boom","method":"GET"}}

--- isolation, three concurrent requests, traceLifecycle 'static' ---
handler responses: {"tag":"alpha","traceId":"a04e6d66d4df47baabc7f3ccc7af4ba9"} {"tag":"gamma","traceId":"c60522c59d374365b8a4730a920bedbc"} {"tag":"beta","traceId":"a5326ead878b4743ab23d5486babc658"}
{"type":"event","exception":"Error: iso-alpha","trace_id":"a04e6d66d4df47baabc7f3ccc7af4ba9","tags":{"probe_tag":"alpha","probe_tag_after":"alpha"}}
{"type":"event","exception":"Error: iso-gamma","trace_id":"c60522c59d374365b8a4730a920bedbc","tags":{"probe_tag":"gamma","probe_tag_after":"gamma"}}
{"type":"event","exception":"Error: iso-beta","trace_id":"a5326ead878b4743ab23d5486babc658","tags":{"probe_tag":"beta","probe_tag_after":"beta"}}

--- incoming trace, traceLifecycle 'static' ---
handler response: {"hasSpan":true,"traceId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parentSpanId":"bbbbbbbbbbbbbbbb"}
{"type":"transaction","name":"GET /trace","op":"http.server","source":"url","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb"}
{"type":"event","message":"trace-probe","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}

--- outgoing fetch + db, traceLifecycle 'static' ---
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"url","status":"ok","trace_id":"20c07eceb59d4305a266a4e5266e8933","spans":["http.client GET http://127.0.0.1:41413/rec"]}
recorder saw: {"sentryTrace":"20c07eceb59d4305a266a4e5266e8933-8dfd780435c20159-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=20c07eceb59d4305a266a4e5266e8933,sentry-sampled=true,sentry-sample_rand=0.20123508141411017,sentry-sample_rate=1"}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"e3bfaf15b40343f9beb56195bf034b7a","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}

--- traceLifecycle 'stream', with the middleware (route names + db + fetch) ---
{"type":"span","trace_id":"6c35758e4b7b4dffb10a8d16615c5511","items":["http.server GET /users/:id"],"raw":[{"name":"GET /users/:id","status":"ok","is_segment":true,"origin":"auto.http.bun.serve","source":"route"}]}
{"type":"span","trace_id":"30898a9a723346b8baaf4831843e4d84","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET /db"],"raw":[{"name":"mysql2.pool.connect","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"mysql2.connect","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"SELECT users","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"GET /db","is_segment":true,"origin":"auto.http.bun.serve","source":"route"}]}
{"type":"span","trace_id":"8e56e6619e644dbeb72428a7c0f65056","items":["http.client GET 127.0.0.1","http.server GET /fetchout"],"raw":[{"name":"GET 127.0.0.1","origin":"auto.http.fetch"},{"name":"GET /fetchout","is_segment":true,"origin":"auto.http.bun.serve","source":"route"}]}

--- logs (7s wait) ---
{"type":"log","items":["info: fresh-bun-log-probe"]}

--- viability baseline, Fresh under bun with no Sentry at all ---
$ PORT=41340 bun _fresh/server.js
Started development server: http://localhost:41340
GET /api/world -> HTTP/1.1 200 OK  "Hello, World!"
GET /          -> HTTP/1.1 200 OK  <!DOCTYPE html>...<title>Fresh counter</title>...
GET /nope      -> HTTP/1.1 404 Not Found  "Not Found"   (Fresh's own 404, middleware logged it)
(deno baseline for the same bundle: `deno serve -A --port 41338 _fresh/server.js` -> identical responses)
```

## Docs note

No page in ~/dev/sentry-docs mentions Fresh at all, on bun or on Deno. `ls ~/dev/sentry-docs/docs/platforms/javascript/guides/` has no `fresh` entry (angular, astro, aws-lambda, azure-functions, bun, capacitor, cloudflare, connect, cordova, deno, effect, electron, elysia, ember, express, fastify, firebase, gatsby, gcp-functions, hapi, hono, koa, nestjs, nextjs, nitro, node, nuxt, react, react-router, remix, solid, solidstart, svelte, sveltekit, tanstackstart-react, vue, wasm). The bun guide is a single page, ~/dev/sentry-docs/docs/platforms/javascript/guides/bun/index.mdx, plus a `configuration/` dir, and it names no framework. A case-insensitive grep for "fresh" across docs/platforms/javascript/ and platform-includes/ only hits the English word, e.g. docs/platforms/javascript/common/session-replay/configuration.mdx and platform-includes/metrics/usage/javascript.mdx.
