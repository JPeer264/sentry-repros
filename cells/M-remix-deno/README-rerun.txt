M-remix-deno — Remix v2 + @sentry/remix 10.67.0 (develop) on Deno 2.9.0

Install (node, npm; NOT deno add):
  S=<scratchpad>
  npm install --legacy-peer-deps \
    $REPRO/_toolbox/pack/sentry-{remix,node,core,react,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz \
    '@remix-run/dev@^2.17.0' '@remix-run/node@^2.17.0' '@remix-run/react@^2.17.0' \
    '@remix-run/server-runtime@^2.17.0' react react-dom vite@^5 mysql2 typescript

deno.json:  { "nodeModulesDir": "manual" }   (node_modules produced by npm above)

Build (under node):   npx remix vite:build

Sink/recorder (node): PORT=41730 node sink.mjs ;  PORT=41732 node recorder.mjs

Run (deno):
  PORT=41731 RECORDER_PORT=41732 SINK_URL=http://127.0.0.1:41730/ TRACE_LIFECYCLE=static \
    deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server-dbfirst.mjs

Server entries:
  server-plain.mjs    no Sentry (proves Remix itself runs on Deno)
  server.mjs          docs ordering: instrument first, then the mysql2 module -> CRASHES on Deno
  server-dbfirst.mjs  mysql2 imported BEFORE instrument -> boots, and db spans still work

Variants (env):
  TRACE_LIFECYCLE=static|stream
  SENTRY_VARIANT=core-fetch   adds deno-fetch-integration.mjs (core addFetchInstrumentationHandler).
                              Adds sentry-trace/baggage to outgoing fetch BUT suppresses every
                              server transaction/span envelope. Do not ship.
  WITH_DB=1                   (server.mjs only) import mysql2 after init -> SyntaxError crash
  SENTRY_DEBUG=1
