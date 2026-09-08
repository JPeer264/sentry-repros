#!/bin/bash
# Nuxt 4.5.2 + @sentry/nuxt 10.67.0 (develop) route names under Deno 2.9.0.
# VERDICT: works with the DEFAULT nitro `node-server` preset, run under `deno run`.
#          broken only with `nitro: { preset: 'deno_server' }`.
set -e
S=$SCRATCH
D=$REPRO/refutations/verify4-M-nuxt-deno-routenames
cd $D
# deps (already installed):
# npm install --no-audit --no-fund nuxt@^4 vue
# npm install --no-audit --no-fund $REPRO/_toolbox/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz

PORT=34411 node $REPRO/_toolbox/sink.mjs > sink-v2.log 2>&1 & sinkpid=$!

# WORKS: default preset (nitro.preset = 'node-server'), sentry import auto-prepended to .output/server/index.mjs
npx nuxt build
(cd $D/.output/server && PORT=34415 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./index.mjs > $D/app-v2-deno.log 2>&1 & echo $! > $D/app-v2.pid)
sleep 12
curl -s http://127.0.0.1:34415/api/trace          # {"name":null,"op":null,"hasActive":true}
curl -s http://127.0.0.1:34415/api/users/42
curl -s http://127.0.0.1:34415/api/sentinel
sleep 4
curl -s http://127.0.0.1:34411/__items | python3 -m json.tool   # transaction "GET /api/users/:id" source "route"
apppid=$(cat $D/app-v2.pid); kill $apppid

# BROKEN contrast: deno_server preset
NITRO_PRESET=deno_server NITRO_OUTPUT_DIR=.output-deno2 npx nuxt build
# SDK bug: the top-level import lands in the bogus file `.output-deno2/server/deno.json start`; prepend by hand:
node -e "const fs=require('fs'),p='$D/.output-deno2/server/index.mjs',d=fs.readFileSync(p,'utf8');if(!d.includes('sentry.server.config'))fs.writeFileSync(p,\"import './sentry.server.config.mjs';\n\"+d)"
(cd $D/.output-deno2 && PORT=34417 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs > $D/app-v2-denopreset.log 2>&1 & echo $! > $D/app-v2-denopreset.pid)
sleep 12
curl -s http://127.0.0.1:34417/api/trace          # {"name":null,"op":null,"hasActive":false}  -> no server span at all
kill $(cat $D/app-v2-denopreset.pid); kill $sinkpid
