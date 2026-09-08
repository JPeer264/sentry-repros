#!/bin/bash
# Nuxt 4 + @sentry/nuxt 10.67.0 (develop) on Deno 2.9.0 -- route names
# WORKING path: default nitro `node-server` preset, output run with `deno run`.
set -e
S=$SCRATCH
D=$REPRO/refutations/verify4-M-nuxt-deno-routenames
cd $D

# 1. deps (only if node_modules is gone)
# npm install --no-audit --no-fund nuxt@^4 vue
# npm install --no-audit --no-fund $REPRO/_toolbox/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz

PORT=34771 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 & sinkpid=$!

# 2. build with the DEFAULT preset (no `nitro: { preset: 'deno_server' }`)
npx nuxt build            # writes .output, and correctly prepends the sentry import to .output/server/index.mjs

# 3. run the node-server output under Deno
cd $D/.output/server
PORT=34772 TRACE_LIFECYCLE=static deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./index.mjs > $D/app.log 2>&1 & apppid=$!
sleep 10
curl -s http://127.0.0.1:34772/api/users/42
curl -s http://127.0.0.1:34772/api/sentinel
sleep 4
curl -s http://127.0.0.1:34771/__items | python3 -m json.tool

kill $apppid; kill $sinkpid

# BROKEN baseline for contrast: USE_DENO_PRESET=1 npx nuxt build  ->  .output-deno
#   the module writes the top-level import into a bogus file `.output-deno/server/deno.json start`,
#   prepend `import './sentry.server.config.mjs';` to .output-deno/server/index.mjs by hand,
#   then: cd .output-deno && PORT=34775 deno run --allow-net ... ./server/index.mjs
#   -> zero transaction/span envelopes, error events carry transaction "GET /api/users/boom".
