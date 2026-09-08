#!/bin/bash
# verify4-M-nuxt-deno-outgoingfetch, round 2.
# Nuxt 4.5.2 (nitro 2.13.4 / h3 1.15.11), @sentry/nuxt 10.67.0 (develop 6f2da7483d), deno 2.9.0,
# nitro preset deno_server. Capability: outgoing fetch (http.client span + sentry-trace/baggage).
#
# RESULT: broken with every documented wiring; FIXED by adding a global-fetch integration
#         (either winterCGFetchIntegration() from @sentry/vercel-edge, or the ~20 line
#         globalFetchIntegration in ./global-fetch-integration.ts built only from @sentry/core).
#         Spans are only *emitted* under traceLifecycle 'stream' (the develop default);
#         under 'static' the parentless http.client span is dropped with no_parent_span
#         because Nuxt-on-Deno has no server span to parent it to. Headers are added in both.
set -x
S=$SCRATCH
D=$S/deep/verify4-M-nuxt-deno-outgoingfetch
cd $D

# deps (do NOT install @sentry/nitro: its nitro@3 peer makes the deno_server output emit
# `import ... from "npm:nitro/storage"`, which crashes at boot with ERR_PACKAGE_PATH_NOT_EXPORTED)
npm install nuxt@^4 vue $S/pack/sentry-vercel-edge-10.67.0.tgz \
  $S/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz

# build + REQUIRED manual patch: with the deno_server preset @sentry/nuxt writes the
# top-level-import line into a bogus file named `.output/server/deno.json start`
npx nuxt build
node -e "const fs=require('fs');const p='.output/server/index.mjs';const c=fs.readFileSync(p,'utf8');if(!c.startsWith(\"import './sentry.server.config.mjs';\"))fs.writeFileSync(p,\"import './sentry.server.config.mjs';\n\"+c)"

PORT=28841 node sink.mjs > sink-r2.log 2>&1 &
PORT=28842 node recorder.mjs > rec-r2b.log 2>&1 &

# SENTRY_FETCH_FIX = none | custom | edge ; LIFECYCLE = stream | static
cd $D/.output
PORT=28845 SINK_PORT=28841 REC_PORT=28842 LIFECYCLE=stream SENTRY_FETCH_FIX=edge \
  deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs &

for r in fetchout fetchout-ofetch fetchout-nodehttp fetchout-inspan; do curl -s http://127.0.0.1:28845/api/$r; done
curl -s http://127.0.0.1:28845/api/sentinel
curl -s http://127.0.0.1:28842/__seen    # sentry-trace / baggage per outgoing request
curl -s http://127.0.0.1:28841/__items   # envelopes
