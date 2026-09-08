# M-fresh-cf: Fresh 2 (@fresh/core 2.3.3, @fresh/plugin-vite 1.1.2, Preact) on Cloudflare Workers (wrangler 4.129.0 dev, workerd 1.20260903.1, compatibility_date 2026-05-01, nodejs_compat)

## What it reproduces

- Fresh 2 needed no adapter. Its vite build already emits `export default { fetch: server.fetch }` (for `deno serve`), which is exactly the Workers module shape, so `withSentry` wraps it directly. No Deno global is touched on the request path for API/page routes — `Deno.serve`/`Deno.build` live only in `App.listen()`, and `import.meta.dirname` reaching the ProdBuildCache root did not throw at module eval under workerd.
- The one Deno-only path that does matter is `staticFiles()`, whose ProdBuildCache `readFile` calls `Deno.stat`/`Deno.open`. I removed that middleware; a real deployment needs Workers Assets. Page rendering itself works (the /boom error page rendered full HTML with the emitted stylesheet link).
- Keeping `@sentry/cloudflare` external to the Fresh SSR bundle is load-bearing: if it were bundled, routes calling `Sentry.setTag`/`captureException` would talk to a second SDK copy with no client. With `external`, wrangler's esbuild resolves both the worker entry and the route chunks to the same node_modules copy. esbuild prints a harmless `[ignored-bare-import] "sideEffects": false` warning for `import "@sentry/cloudflare"` in each route chunk.
- The most interesting gap is route names: nothing in @sentry/cloudflare knows about Fresh's router, so every span is either `GET /users/42` (static, source url) or bare `GET` (stream). Fresh exposes the matched pattern on the context, so a five-line middleware fixes it, but it lands as source `custom` because `updateSpanName` overrides the source. A Fresh integration setting source `route` would be the real fix.
- db spans are doubly blocked on this runtime: mysql2 cannot run on workerd at all (`new Function` is disallowed), and the only instrumentation path that exists for Cloudflare (build-time channel injection) requires the driver inside the bundle, which is exactly what breaks it via `createRequire(import.meta.url)` in Vite's CJS interop. mysql@2 external is the only combination that queries successfully, and it gets no spans.
- I did not use @cloudflare/vite-plugin; Fresh's own vite build plus plain `wrangler dev` was enough, which also means `sentryCloudflareVitePlugin`'s autoInstrumentation half (worker-entry wrapping from wrangler config) has no environment to attach to here and must be disabled.
- Cleanup done: wrangler/workerd, sink and recorder processes killed (pids 89846, 89407, 2672, 16625, 89830, 89831, 89845, 93354; all three ports verified free), and app/node_modules removed (327M). The dir is left at 4.9M with sources, the built `_fresh/` output and the logs. Reinstall with the npm line above to rerun.
- Ports used: sink 22984, recorder 20504, wrangler 58164. Two earlier picks (41777, 47311) were already held by other agents' sinks; I moved rather than touching them.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Fresh 2 runs on Workers unmodified: `vite build` (Fresh's own plugin) emits `_fresh/server.js` whose default export is already `{ fetch }`, and wrangler/esbuild bundles it. No Cloudflare adapter, no @cloudflare/vite-plugin needed.

1. Scaffold a Fresh 2 app (`deno run -A -r jsr:@fresh/init .`).
2. `npm install <sentry-cloudflare tgz> <sentry-core tgz> <sentry-opentelemetry tgz> <sentry-server-utils tgz> wrangler@4 vite preact @preact/signals @prefresh/vite @babel/core @babel/preset-react preact-render-to-string rollup esbuild-wasm @types/babel__core @remix-run/node-fetch-server` (deno.json keeps `nodeModulesDir: "manual"`; deno resolves jsr:@fresh/* itself).
3. vite.config.ts — keep `@sentry/cloudflare` (and any DB driver) OUT of the Fresh SSR bundle so the Worker gets exactly one SDK instance:
```ts
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
export default defineConfig({
  plugins: [fresh()],
  environments: { ssr: { build: { rollupOptions: {
    external: ["@sentry/cloudflare", "mysql", "mysql2", "mysql2/promise"] } } } },
});
```
4. worker.ts (the wrangler entry, NOT the Fresh entry):
```ts
import * as Sentry from "@sentry/cloudflare";
import server from "./_fresh/server.js";
export default Sentry.withSentry(
  () => ({ dsn: "...", tracesSampleRate: 1.0, traceLifecycle: "static" }),
  { fetch: (request: Request) => server.fetch(request, {
      remoteAddr: { transport: "tcp", hostname: "127.0.0.1", port: 0 } }) },
);
```
The second argument to `server.fetch` matters: Fresh's handler expects a `Deno.ServeHandlerInfo`, so pass a stub rather than `env`.
5. wrangler.jsonc: `{ "main": "worker.ts", "compatibility_date": "2026-05-01", "compatibility_flags": ["nodejs_compat"] }`.
6. `deno task build && npx wrangler dev --port <port> --inspector-port 0`.

Two things a docs page must also say: (a) route handler errors are swallowed by Fresh, so add `routes/_error.tsx` calling `Sentry.captureException(ctx.error)`; (b) `staticFiles()` middleware is Deno-only (`Deno.stat`/`Deno.open`) — drop it and serve assets via Workers Assets.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
D=$REPRO/cells/M-fresh-cf

# 1. reinstall (node_modules was removed to save disk)
cd $D/app
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  vite@^7.1.3 preact@^10.29.1 @preact/signals@^2.9.0 mysql@^2 mysql2@^3 wrangler@4 \
  @prefresh/vite@^2.4.8 @babel/core@^7 @babel/preset-react@^7 preact-render-to-string@^6 \
  rollup@^4 esbuild-wasm@^0.25 @types/babel__core@^7 @remix-run/node-fetch-server@^0.12.0

# 2. sink + local fetch recorder (pick your own free ports; sink port must match worker.ts)
PORT=22984 node $D/sink.mjs > $D/sink.log 2>&1 &
PORT=20504 node $D/rec.mjs  > $D/rec.log  2>&1 &

# 3. build Fresh and run on workerd
cd $D/app && deno task build
npx wrangler dev --port 58164 --inspector-port 0 > $D/wrangler.log 2>&1 &
# readiness: "[wrangler:info] Ready on http://localhost:58164"

# 4. probes (sentinel last, then read the sink)
curl -s -X DELETE http://127.0.0.1:22984/__items
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:58164/boom      # errors
curl -s http://127.0.0.1:58164/users/42                                    # route names
curl -s -H 'sentry-trace: 11111111111111111111111111111111-2222222222222222-1' \
     -H 'baggage: sentry-trace_id=11111111111111111111111111111111,sentry-public_key=publickey,sentry-sample_rate=1,sentry-sampled=true' \
     http://127.0.0.1:58164/users/7                                        # incoming trace
curl -s "http://127.0.0.1:58164/outfetch?rec=http%3A%2F%2F127.0.0.1%3A20504%2Fping"  # outgoing fetch
curl -s http://127.0.0.1:58164/dbq   # mysql2 -> EvalError
curl -s http://127.0.0.1:58164/dbq2  # mysql@2 -> rows, no span
curl -s http://127.0.0.1:58164/logit                                       # logs
for t in alpha bravo charlie; do curl -s http://127.0.0.1:58164/iso/$t & done; wait   # isolation
curl -s 'http://127.0.0.1:58164/sentinel?n=1'
sleep 7 && curl -s http://127.0.0.1:22984/__items
curl -s http://127.0.0.1:20504/dump   # headers on the outgoing fetch

# variants
# - out-of-the-box route names: delete the ctx.route middleware from app/main.ts, rebuild
# - stream lifecycle: sed -i '' 's/traceLifecycle: "static"/traceLifecycle: "stream"/' app/worker.ts, rebuild
# - db instrumentation attempt: add sentryCloudflareVitePlugin({autoInstrumentation:false})
#   to vite.config.ts plugins and drop mysql/mysql2 from `external`
```

Files: `app/`, `ports.env`, `rec.log`, `rec.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `wrangler.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | partial | Out of the box an error thrown in a route handler never reaches Sentry: Fresh's DEFAULT_ERROR_HANDLER does `console.error(error); return new Response("Internal server error", { status: 500 })`, so only the request span turns internal_error and no event is sent (verified with debug:true — the log shows the root span finishing with no "Captured error event"). Adding `routes/_error.tsx` with `Sentry.captureException(ctx.error)` sends it, as a handled `generic` mechanism event with request data attached. Both lifecycles behave the same. |
| route names | broken | The server transaction for /users/42 is named "GET /users/42" with source "url" under traceLifecycle 'static'; under the default 'stream' lifecycle the segment span is named just "GET" (origin auto.http.cloudflare, no source attribute). @sentry/cloudflare has no Fresh router hook, so the parameterized pattern is never used. A middleware reading `ctx.route` and calling `Sentry.updateSpanName(getRootSpan(span), \`${method} ${ctx.route}\`)` yields "GET /users/:id" but with source "custom", not "route". |
| isolation | works | Three concurrent GETs to /iso/:tag each did Sentry.setTag + a 60ms await + captureException. Each event carried only its own probe_tag and a distinct trace id; no cross-talk. traceLifecycle 'static'. |
| incoming trace | works | GET /users/7 with sentry-trace 1111…-2222222222222222-1 and a matching baggage produced a transaction with trace_id 11111111111111111111111111111111 and parent_span_id 2222222222222222. traceLifecycle 'static'. |
| outgoing fetch | works | A fetch from inside a Fresh route handler to a local recorder got an http.client span ("http.client GET http://127.0.0.1:20504/ping" in 'static'; "http.client GET 127.0.0.1" with origin auto.http.fetch as a child of the http.server segment in 'stream') and the recorder saw sentry-trace and baggage whose trace id equals the server transaction's. |
| db spans | broken | Both shapes fail. (1) Driver external (module-scope connection): mysql@2 works and returns rows over nodejs_compat TCP, but produces no db span at all — build-time channel injection only reaches modules inside the bundle; mysql2 cannot even run, it throws `EvalError: Code generation from strings disallowed for this context` on the first query. (2) Driver bundled with `sentryCloudflareVitePlugin({ autoInstrumentation: false })` added to Fresh's vite config: the orchestrion transform does run and injects the channels into the route chunks, but both drivers then die at module init with `TypeError: The argument 'path' ... Received 'undefined' at createRequire (node:module:34:15)` — Vite's CJS interop emits `createRequire(import.meta.url)` and import.meta.url is undefined in the Fresh SSR chunk under workerd. Instrumentation path used: Cloudflare Vite plugin (sentryOrchestrionPlugin) mounted into Fresh's own vite build; the Cloudflare vite plugin's autoInstrumentation half is unusable here because there is no @cloudflare/vite-plugin worker environment. |
| logs | works | Sentry.logger.info("fresh-cf-log-line", { where: "route" }) inside a route handler arrived as a log envelope in both lifecycles. |
| client errors | not-run | Browser-side probing was out of scope for this cell; only the server (Worker) side was exercised. Fresh islands are hydrated by a Preact client bundle, which would need @sentry/browser wired into client.ts separately. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
errors — no event out of the box (wrangler --debug log, /boom):
  Sentry Logger [log]: [Tracing] Starting sampled root span
    op: http.server
    name: GET /boom
  [wrangler:info] GET /boom 500 Internal Server Error (12ms)
  (sink after sentinel:)
  {"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"5fa4062d07e7497696d254c1e47d0b6c","sdk":"sentry.javascript.cloudflare","spans":[]}

errors — with routes/_error.tsx:
  {"type":"event","exception":"Error: fresh-cf-route-error","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"b0257b19946041d197bad24ccdc53a4c","request":{"url":"http://127.0.0.1:58164/boom","method":"GET"}}
  {"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"b0257b19946041d197bad24ccdc53a4c"}

route names — static lifecycle, out of the box:
  {"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.cloudflare","spans":[]}
route names — stream lifecycle (default), out of the box:
  {"type":"span","trace_id":"34ee1af8cc0e4ea4be224794e2fb98b5","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
route names — with the ctx.route middleware:
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"custom","status":"ok"}

isolation — three concurrent /iso/:tag:
  {"ex":"Error: iso-alpha","tags":{"probe_tag":"alpha"},"trace":"bcda7b8792d445b8ae3b6075959913f9"}
  {"ex":"Error: iso-bravo","tags":{"probe_tag":"bravo"},"trace":"4187332e3694403dafc40a0001443665"}
  {"ex":"Error: iso-charlie","tags":{"probe_tag":"charlie"},"trace":"49870b3415f9490f8d75dcf0cf3a0788"}

incoming trace:
  {"type":"transaction","name":"GET /users/7","op":"http.server","source":"url","status":"ok","trace_id":"11111111111111111111111111111111","parent_span_id":"2222222222222222","sdk":"sentry.javascript.cloudflare"}

outgoing fetch — static lifecycle:
  {"type":"transaction","name":"GET /outfetch","op":"http.server","source":"url","status":"ok","trace_id":"930a09ab4b0d46e0b17a4464b39d2db5","spans":["http.client GET http://127.0.0.1:20504/ping"]}
  recorder: {"url":"/ping","sentry-trace":"930a09ab4b0d46e0b17a4464b39d2db5-be78c3b04997a5b7-1","baggage":"sentry-environment=production,sentry-public_key=publickey,sentry-trace_id=930a09ab4b0d46e0b17a4464b39d2db5,sentry-sampled=true,sentry-sample_rand=0.34169891545287157,sentry-sample_rate=1"}
outgoing fetch — stream lifecycle:
  {"type":"span","trace_id":"722847cc7bee45f7b5f4cfddd66f8d0c","items":["http.client GET 127.0.0.1","http.server GET"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"a13e3a71eeee42c5","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
  recorder: {"url":"/ping2","sentry-trace":"722847cc7bee45f7b5f4cfddd66f8d0c-abfca77538257c2e-1","baggage":"...sentry-trace_id=722847cc7bee45f7b5f4cfddd66f8d0c,sentry-sampled=true..."}

db — driver external, mysql2:
  {"type":"event","exception":"EvalError: Code generation from strings disallowed for this context","sdk":"sentry.javascript.cloudflare","request":{"url":"http://127.0.0.1:58164/dbq"}}
db — driver external, mysql@2 (query succeeds, zero spans):
  body: [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
  {"type":"transaction","name":"GET /dbq2","op":"http.server","source":"url","status":"ok","spans":[]}
db — driver bundled + sentryCloudflareVitePlugin (channels injected, driver dies):
  TypeError: The argument 'path' The argument must be a file URL object, a file URL string, or an absolute path string.. Received 'undefined'
      at createRequire (node:module:34:15)
      at _fresh/server/assets/_fresh-route___dbq2-DtLdLgVq.js (.../.wrangler/tmp/dev-y07h3v/worker.js:25637:17)

logs:
  {"type":"log","items":["info: fresh-cf-log-line"]}
```

## Docs note

No page in ~/dev/sentry-docs mentions Fresh at all. There is no guides/fresh/ directory, and the only "fresh" hits under docs/platforms/javascript/ are the ordinary English word (docs/platforms/javascript/guides/cloudflare/features/agents-sdk.mdx:39, platform-includes/distributed-tracing/custom-instrumentation/server/javascript.mdx:108). The Cloudflare guide's framework list at docs/platforms/javascript/guides/cloudflare/index.mdx:16-23 names Astro, Hono, Hydrogen, Next.js, Nuxt, Remix, SvelteKit and TanStack Start, and nothing else; docs/platforms/javascript/guides/cloudflare/frameworks/ has no Fresh entry. So the Fresh-on-Cloudflare combination is undocumented in both directions.
