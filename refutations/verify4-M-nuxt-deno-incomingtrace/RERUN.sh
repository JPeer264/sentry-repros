#!/bin/bash
# Rerun: Nuxt 4.5.2 + @sentry/nuxt 10.67.0 (develop) on Deno 2.9.0, incoming-trace capability.
set -x
S=$SCRATCH
D=$S/deep/verify4-M-nuxt-deno-incomingtrace
cd $D
npm install --no-audit --no-fund nuxt@^4 vue
npm install --no-audit --no-fund $S/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz
# IMPORTANT: do NOT install @sentry/nitro. It drags in nitro@3.0.0, which shadows nitropack 2.13.4
# and makes the build emit `import 'nitro/storage'` -> ERR_PACKAGE_PATH_NOT_EXPORTED at boot (node AND deno).

PORT=41120 node $S/qs/sink.mjs > sink.log 2>&1 & SINK=$!

# ---- A) default preset (node-server), run with deno  => incoming trace WORKS
npx nuxt build                       # nuxt.config.ts has no `nitro.preset`
head -1 .output/server/index.mjs     # -> import './sentry.server.config.mjs';  (auto-injected, correct file)
(cd .output && PORT=41125 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs) & APP=$!
sleep 10
curl -s http://127.0.0.1:41125/api/trace \
  -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
  -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sampled=true'
curl -s http://127.0.0.1:41125/api/error -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sampled=true'
curl -s http://127.0.0.1:41125/api/sentinel
sleep 4; curl -s http://127.0.0.1:41120/__items
kill $APP; wait $APP

# ---- B) deno_server preset => incoming trace BROKEN (needs the manual entry patch too)
NITRO_PRESET=deno_server npx nuxt build
cat '.output/server/deno.json start'                 # <- SDK wrote the import into this bogus filename
{ echo "import './sentry.server.config.mjs';"; cat .output/server/index.mjs; } > /tmp/e.mjs && cat /tmp/e.mjs > .output/server/index.mjs
(cd .output && PORT=41127 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs) & APP=$!
sleep 10
curl -s http://127.0.0.1:41127/api/trace -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sampled=true'
kill $APP; wait $APP
kill $SINK; wait $SINK
# server/plugins/sentry-deno-trace.ts is the deno_server workaround (continueTrace + startSpan around h3App.handler)
