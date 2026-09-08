#!/bin/zsh
# Nuxt 4.5.2 (nitropack 2.13.4 / h3 1.15.11) + @sentry/nuxt 10.67.0 (develop) on deno 2.9.0
# Capability under test: per-request isolation scope.
set -e
S=$SCRATCH
V=$REPRO/refutations/verify4-M-nuxt-deno-isolation
APP=$V/app

# 1. deps (do NOT install @sentry/nitro: it drags in nitro@3.0.0, which makes the
#    @sentry/nuxt module take its Nitro-v3 code path on a Nitro-v2 app and the build/boot fails
#    with `[ERR_PACKAGE_PATH_NOT_EXPORTED] Package subpath './storage' is not defined by "exports" in nitro`)
cd $APP
npm install nuxt@^4 vue
npm install $REPRO/_toolbox/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz

# 2. sink
PORT=41377 node $REPRO/_toolbox/sink.mjs > $V/sink.log 2>&1 & echo $! > $V/sink.pid

# --- A: reported setup, nitro preset deno_server -------------------------------
cd $APP && npx nuxt build                       # nitro.json preset: deno-server-legacy
# The module writes the Sentry import into a bogus file `.output/server/deno.json start`
# instead of the entry, so prepend it manually:
{ echo "import './sentry.server.config.mjs';"; cat $APP/.output/server/index.mjs; } > $APP/.output/server/index.patched.mjs
cd $APP/.output && PORT=41380 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.patched.mjs > $V/app-deno.log 2>&1 & echo $! > $V/app-deno.pid
sleep 12
curl -s -X DELETE http://127.0.0.1:41377/__items > /dev/null
for t in alpha beta gamma; do curl -s "http://127.0.0.1:41380/api/tag?tag=$t" & done; sleep 3
curl -s http://127.0.0.1:41380/api/sentinel; sleep 4
curl -s http://127.0.0.1:41377/__items          # -> all four events carry probe_tag "gamma" + one trace id
grep "isolation scope" $V/app-deno.log          # -> 1x "Created new", then only "Using existing"
kill $(cat $V/app-deno.pid)

# --- B: same app, nitro preset node_server, run by deno ------------------------
mv $APP/.output $V/out-deno-server
cd $APP && NITRO_PRESET_OVERRIDE=node_server npx nuxt build   # entry gets the sentry import automatically
cd $APP/.output && PORT=41383 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs > $V/app-node-preset2.log 2>&1 & echo $! > $V/app-node-preset2.pid
sleep 14
curl -s -X DELETE http://127.0.0.1:41377/__items > /dev/null
curl -s http://127.0.0.1:41383/api/sentinel                      # A: clean, no tags
curl -s "http://127.0.0.1:41383/api/tag?tag=solo"                # B
curl -s http://127.0.0.1:41383/api/sentinel                      # C: leaks probe_tag solo
for t in alpha beta gamma; do curl -s "http://127.0.0.1:41383/api/tag?tag=$t" & done; sleep 3   # D: each correct
curl -s http://127.0.0.1:41383/api/sentinel                      # E: still probe_tag solo
sleep 5; curl -s http://127.0.0.1:41377/__items
curl -s http://127.0.0.1:41383/api/trace                         # -> isolationTags {"probe_tag":"solo"}
kill $(cat $V/app-node-preset2.pid)

# --- C: control, identical node_server build run by node ----------------------
cd $APP/.output && PORT=41382 node ./server/index.mjs > $V/app-node-runtime.log 2>&1 & echo $! > $V/app-node-runtime.pid
# same request sequence -> three distinct tags/traces AND sentinels with no tags at all

# --- D: attempted app-level workaround (FAILED) --------------------------------
# server/middleware/00-sentry-isolate.ts calling `Sentry.getIsolationScope().clear()` at request
# start would drop the inherited data, but `Scope.clear()` was removed in the v11 line:
#   {"exc":"TypeError: getIsolationScope$1(...).clear is not a function"}  (every route -> HTTP 500)
