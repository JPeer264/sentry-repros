#!/bin/bash
# verify4-M-nuxt-deno-incomingtrace -- REFUTATION run (2026-09-06)
# Nuxt 4.5.2 / nitro 2.13.4 + @sentry/nuxt 10.67.0 (develop 6f2da7483d) on deno 2.9.0.
# Result: incoming trace WORKS on Deno with the DEFAULT (node-server) nitro preset.
#         It is broken ONLY with `nitro: { preset: 'deno_server' }`.
set -x
S=$SCRATCH
D=$S/deep/verify4-M-nuxt-deno-incomingtrace
cd $D
# deps (node_modules removed after the run to save disk)
npm install --no-audit --no-fund nuxt@^4 vue
npm install --no-audit --no-fund $S/pack/sentry-{nuxt,node,core,server-utils,server-runtime-injection,opentelemetry,browser,vue,browser-utils,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz
# do NOT install @sentry/nitro: it pulls nitro@3 which shadows nitropack 2.13.4 and breaks the boot.
# server/plugins/ must be EMPTY (the deno_server workaround plugin is parked at attic-sentry-deno-trace.ts.off)

PORT=41120 node $S/qs/sink.mjs > sinkA.log 2>&1 & SINK=$!
H1='sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1'
H2='baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true'

# ---- A) default preset (nuxt.config.ts has NO nitro.preset), output run by deno  => WORKS
npx nuxt build                        # entry gets `import './sentry.server.config.mjs';` auto-injected
head -c 40 .output/server/index.mjs
(cd .output && PORT=41131 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs) & APP=$!
sleep 8
curl -s -H "$H1" -H "$H2" http://127.0.0.1:41131/api/trace   # trace_id aaaa..., parent_span_id bbbb...
curl -s -H "$H1" -H "$H2" http://127.0.0.1:41131/api/error
curl -s http://127.0.0.1:41131/api/sentinel                  # sentinel, no headers -> its own trace id
sleep 3; curl -s http://127.0.0.1:41120/__items
kill $APP; curl -s -X DELETE http://127.0.0.1:41120/__items

# ---- B) deno_server preset => BROKEN (reproduces the report)
NITRO_PRESET=deno_server npx nuxt build
cat '.output/server/deno.json start'   # SDK writes the top-level import into this bogus filename
{ echo "import './sentry.server.config.mjs';"; cat .output/server/index.mjs; } > entryB.mjs && cat entryB.mjs > .output/server/index.mjs
(cd .output && PORT=41133 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs) & APP=$!
sleep 8
curl -s -H "$H1" -H "$H2" http://127.0.0.1:41133/api/trace   # hasActiveSpan:false, trace_id null
curl -s -H "$H1" -H "$H2" http://127.0.0.1:41133/api/error
sleep 3; curl -s http://127.0.0.1:41120/__items              # events carry the process-wide trace id
kill $APP; curl -s -X DELETE http://127.0.0.1:41120/__items

# ---- C) default preset + traceLifecycle 'stream' => WORKS too (span envelopes, parent_span_id bbbb...)
sed -i.bakX "s/traceLifecycle: 'static',/traceLifecycle: 'stream',/" sentry.server.config.ts
npx nuxt build
(cd .output && PORT=41135 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./server/index.mjs) & APP=$!
sleep 8
curl -s -H "$H1" -H "$H2" http://127.0.0.1:41135/api/trace
curl -s -H "$H1" -H "$H2" http://127.0.0.1:41135/api/error
curl -s http://127.0.0.1:41135/api/sentinel
sleep 4; curl -s http://127.0.0.1:41120/__items
kill $APP; kill $SINK
