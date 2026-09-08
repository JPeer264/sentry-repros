#!/bin/bash
# Rerun: Nuxt 4.5.2 (nitropack 2.13.4) on Deno 2.9.0, preset deno_server, @sentry/nuxt 10.67.0 (develop).
# Capability under test: outgoing fetch (http.client span + sentry-trace/baggage).
set -x
S=$SCRATCH
D=$REPRO/refutations/verify4-M-nuxt-deno-outgoingfetch
cd $D

# 1. deps (NOTE: do NOT install @sentry/nitro - its peer dep pulls nitro@3, and @sentry/nuxt's
#    storage.server plugin then emits `import ... from "npm:nitro/storage"` into the deno_server
#    output, which crashes at boot with ERR_PACKAGE_PATH_NOT_EXPORTED)
npm install nuxt@^4 vue \
  $REPRO/_toolbox/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz
# optional, only for the winterCGFetchIntegration variant:
npm install $REPRO/_toolbox/pack/sentry-vercel-edge-10.67.0.tgz

# 2. build + REQUIRED manual patch (the module writes the import into `.output/server/deno.json start`)
npx nuxt build
node -e "const fs=require('fs');const p='.output/server/index.mjs';const c=fs.readFileSync(p,'utf8');if(!c.startsWith(\"import './sentry.server.config.mjs';\"))fs.writeFileSync(p,\"import './sentry.server.config.mjs';\n\"+c)"

# 3. sink + recorder
PORT=34011 node sink.mjs > sink.log 2>&1 &
PORT=34012 node recorder.mjs > rec.log 2>&1 &

# 4. run. SENTRY_FETCH_FIX=none | custom | edge ; LIFECYCLE=stream | static
cd $D/.output
PORT=34015 SINK_PORT=34011 REC_PORT=34012 LIFECYCLE=stream SENTRY_FETCH_FIX=none \
  deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs &

# 5. drive
for r in fetchout fetchout-ofetch fetchout-nodehttp fetchout-inspan; do curl -s http://127.0.0.1:34015/api/$r; done
curl -s http://127.0.0.1:34015/api/sentinel
curl -s http://127.0.0.1:34012/__seen        # sentry-trace / baggage per outgoing request
curl -s http://127.0.0.1:34011/__items       # envelopes
curl -s 'http://127.0.0.1:34011/__items?raw' # includes client_report discard reasons
