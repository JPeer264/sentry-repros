#!/bin/bash
# Nuxt 4.5.2 (nitro 2.13.4) + @sentry/nuxt 10.67.0 (develop) on Deno 2.9.0.
# db spans: CONFIRMED WORKING. Two ways.
set -e
S=$SCRATCH
D=$S/deep/verify4-M-nuxt-deno-dbspans
cd $D/app
npm install --no-audit --no-fund
PORT=47313 node $S/qs/sink.mjs > $D/sink-b.log 2>&1 & echo $! > $D/sink-b.pid

# --- A) deno_server preset (nuxt.config.ts as committed) --------------------
# nuxt.config.ts MUST carry: nitro: { externals: { inline: ['generate-function','named-placeholders'] } }
# otherwise /api/db 500s with "genFunc$1 is not a function".
npx nuxt build
# SDK bug: with deno_server it writes the top-level import into a file literally
# named ".output/server/deno.json start". Use a wrapper entry instead.
printf "import './sentry.server.config.mjs';\nimport './index.mjs';\n" > $D/app/.output/server/boot.mjs
cd $D/app/.output
PORT=41353 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi \
  --unstable-byonm ./server/boot.mjs &
# curl /api/dbspan  -> db spans (needs a manual parent: no http.server span exists here)
# curl /api/db      -> 200 but NO span (requiresParentSpan:true and no request span)

# --- B) node-server preset, still run by deno (RECOMMENDED) -----------------
cd $D/app
NITRO_PRESET=node-server npx nuxt build     # SDK prepends the import into index.mjs correctly
cd $D/app/.output
PORT=41354 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi \
  --unstable-byonm --unstable-detect-cjs ./server/index.mjs &
# curl /api/db -> http.server GET root span + db mysql2.pool.connect + db "SELECT users"
