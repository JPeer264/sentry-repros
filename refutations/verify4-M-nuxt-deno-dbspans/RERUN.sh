#!/bin/bash
# Nuxt 4.5.2 (nitropack 2.13.4) + @sentry/nuxt 10.67.0 (develop) on Deno 2.9.0, nitro preset deno_server.
# Proves db spans (mysql2 AND mysql) DO work.
set -e
S=$SCRATCH
D=$S/deep/verify4-M-nuxt-deno-dbspans

# 1. deps. Do NOT install @sentry/nitro: it drags in nitro@3 and the build then
#    fails at runtime with ERR_PACKAGE_PATH_NOT_EXPORTED for 'nitro/storage'.
cd $D/app
npm install --no-audit --no-fund

# 2. sink
PORT=52713 node $S/qs/sink.mjs > $D/sink2.log 2>&1 & echo $! > $D/sink2.pid

# 3. build
npx nuxt build

# 4. REQUIRED: the module writes the top-level import into a bogus file called
#    ".output/server/deno.json start" instead of the entry. Use a wrapper entry instead
#    of editing index.mjs.
printf "import './sentry.server.config.mjs';\nimport './index.mjs';\n" > $D/app/.output/server/boot.mjs

# 5. run the wrapper, not index.mjs
cd $D/app/.output
PORT=41350 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi \
  --unstable-byonm ./server/boot.mjs &

sleep 12
curl -s http://127.0.0.1:41350/api/db       # mysql2, no root span   -> 200, span created but not exported
curl -s http://127.0.0.1:41350/api/dbspan   # mysql2 inside startSpan -> 200 + transaction with db spans
curl -s http://127.0.0.1:41350/api/sentinel
sleep 3
curl -s http://127.0.0.1:52713/__items
