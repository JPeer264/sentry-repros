# verify4-M-astro-deno-outgoingfetch

Astro 7 (output: 'server') + @deno/astro-adapter 0.6.0 + @sentry/astro 10.67.0 (develop) on Deno 2.9.0.

## Install
npm install astro@7 @deno/astro-adapter \
  $S/pack/sentry-{astro,browser,browser-utils,core,node,opentelemetry,server-runtime-injection,server-utils,bundler-plugins,replay,replay-canvas,feedback,cloudflare}-10.67.0.tgz

## Run
PORT=53821 node sink.mjs & PORT=53822 node rec.mjs &
npx astro build
SINK_PORT=53821 REC_PORT=53822 LIFECYCLE=static [FETCH_FIX=cloudflare|custom] \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-run dist/server/entry.mjs

curl http://127.0.0.1:53823/            # warm .astro page so sentry.server.config loads
curl http://127.0.0.1:53823/outfetch    # global fetch -> recorder
curl http://127.0.0.1:53823/outhttp     # node:http   -> recorder
curl http://127.0.0.1:53823/sentinel    # sentinel
curl http://127.0.0.1:53821/__items ; curl http://127.0.0.1:53822/__hits

## Result
FETCH_FIX unset          -> GET /outfetch spans: []              , recorder: no sentry-trace/baggage
FETCH_FIX=cloudflare     -> spans: ["http.client GET .../rec"]   , recorder: both headers
FETCH_FIX=custom         -> same, span origin auto.http.fetch
node:http always works in every configuration.

## Root cause
dc-probe.mjs: under Deno 2.9.0 a global fetch() fires NO diagnostics_channel events
("undici:*" and "http.client.*" both empty); node:http fires http.client.request.created/start/response.finish.
@sentry/node's only outgoing-fetch path is the vendored undici diagnostics_channel instrumentation
(packages/node/src/integrations/node-fetch/undici-instrumentation.ts), so it can never see Deno's fetch.

## Re-verification (verify4 pass, fresh install + fresh runs)
npm install --no-audit --no-fund   # node_modules had been cleaned; dist/ was kept, no rebuild needed
PORT=53821 node sink.mjs & PORT=53822 node rec.mjs &
SINK_PORT=53821 REC_PORT=53822 LIFECYCLE=static                      deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-run dist/server/entry.mjs
SINK_PORT=53821 REC_PORT=53822 LIFECYCLE=static FETCH_FIX=cloudflare deno run ... dist/server/entry.mjs
SINK_PORT=53821 REC_PORT=53822 LIFECYCLE=stream FETCH_FIX=custom     deno run ... dist/server/entry.mjs
logs: app-v2-base.log, app-v2-cf.log, app-v2-custom-stream.log

baseline  : "GET /outfetch" spans: []                                  rec: sentryTrace null, baggage null
cloudflare: "GET /outfetch" spans: ["http.client GET http://127.0.0.1:53822/rec"]  rec: both headers
custom    : span envelope "http.client GET 127.0.0.1" origin auto.http.fetch      rec: both headers
node:http works in all three.

dc-probe.mjs on deno 2.9.0:
  after global fetch, channels fired: []
  after node:http get, channels fired: ["http.client.request.created","http.client.request.start","http.client.response.finish"]

Export check: @sentry/node and @sentry/astro export only nativeNodeFetchIntegration (undici/diagnostics_channel).
A globalThis.fetch-patching fetchIntegration exists only in @sentry/bun and @sentry/cloudflare, and as
winterCGFetchIntegration in @sentry/vercel-edge. @sentry/deno has none.
Repo e2e corroboration: dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts asserts only the
manual span (origin 'manual') around fetch, never an http.client span.
