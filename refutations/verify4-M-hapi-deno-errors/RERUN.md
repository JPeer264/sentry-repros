# verify4-M-hapi-deno-errors

Refutes "Hapi errors on Deno need the @sentry/deno/import hook + the JSON load-hook workaround".

Two hook-free routes both deliver the error event.

## Setup (already installed)
npm install $S/pack/sentry-{deno,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz @hapi/hapi@21 mysql@2 esbuild
hapi 21.4.10, deno 2.9.0, deno.json nodeModulesDir "manual".

## Run
PORT=52831 node $S/qs/sink.mjs > sink.log 2>&1 &

./run.sh main-nohook.ts 41777 A-nohook-static          LIFECYCLE=static MANUAL_ERR_HANDLER=0  # baseline: no event
./run.sh main-nohook.ts 41778 B-nohook-manual-static   LIFECYCLE=static MANUAL_ERR_HANDLER=1  # WORKS
./run.sh main-nohook.ts 41779 C-nohook-manual-stream   LIFECYCLE=stream MANUAL_ERR_HANDLER=1  # WORKS
./run.sh main-hook.ts   41780 D-hook-nojsonfix         LIFECYCLE=static MANUAL_ERR_HANDLER=0  # crash at boot
node build.mjs
./run.sh dist/main.js   41781 E-esbuild-static         LIFECYCLE=static MANUAL_ERR_HANDLER=0  # WORKS + route names + spans
./run.sh dist/main.js   41782 F-esbuild-stream         LIFECYCLE=stream MANUAL_ERR_HANDLER=0  # WORKS

## Fix B: manual attach, no hook, no json-fix
import { attachHapiErrorHandler } from "@sentry/server-utils";
attachHapiErrorHandler(server);          // before/after server.start(), both fine
Not exported from @sentry/deno (verified: exports-check.ts prints undefined).

## Fix E: esbuild + sentryOrchestrionPlugin (build.mjs), run the bundle with deno
No runtime hook, no json-fix. Adds parameterized route names and router/db spans on top.

## Re-run 2026-09-06 (evidence captured to items2-*.json / r2-*.log)
PORT=47318 node $S/qs/sink.mjs > sink2.log 2>&1 &
./run2.sh main-nohook.ts 41791 A-nohook-static        LIFECYCLE=static MANUAL_ERR_HANDLER=0  # no event for /error
./run2.sh main-nohook.ts 41792 B-nohook-manual-static LIFECYCLE=static MANUAL_ERR_HANDLER=1  # event, auto.function.hapi
./run2.sh main-nohook.ts 41793 C-nohook-manual-stream LIFECYCLE=stream MANUAL_ERR_HANDLER=1  # event, auto.function.hapi
node build.mjs
./run2.sh dist/main.js  41794 E-esbuild-static        LIFECYCLE=static MANUAL_ERR_HANDLER=0  # event + route names + router/db spans
./run2.sh dist/main.js  41795 F-esbuild-stream        LIFECYCLE=stream MANUAL_ERR_HANDLER=0  # event + router/db spans

exports-check.ts: deno.setupHapiErrorHandler undefined, deno.hapiIntegration function,
server-utils.attachHapiErrorHandler function. @sentry/server-utils is a direct dep of @sentry/deno.
