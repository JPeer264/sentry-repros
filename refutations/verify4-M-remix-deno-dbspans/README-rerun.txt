verify4-M-remix-deno-dbspans - Remix v2 + @sentry/remix 10.67.0 (develop) on Deno 2.9.0, db spans

Install (node, npm; NOT deno add) - same as $S/deep/M-remix-deno/README-rerun.txt:
  npm install --legacy-peer-deps \
    $S/pack/sentry-{remix,node,core,react,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz \
    '@remix-run/dev@^2.17.0' '@remix-run/node@^2.17.0' '@remix-run/react@^2.17.0' \
    '@remix-run/server-runtime@^2.17.0' react react-dom vite@^5 mysql2 typescript
Remix build (node):  npx remix vite:build
Sink (node):         PORT=46311 node sink.mjs > sinkR.log 2>&1 &

Server entries (all use CANONICAL order: instrument.server.mjs imported first):
  server.mjs        instrument -> db.mjs (module-scope mysql2 pool)
  server-lazy.mjs   instrument -> await import('./db-lazy.mjs') (mysql2 loaded strictly after init)

Bundles (node):
  node build-server2.mjs   -> dist-server2/server.mjs   (esbuild + sentryOrchestrionPlugin, banner createRequire)
  node build-lazy.mjs      -> dist-lazy/server.mjs

Runs (deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys <entry>), env:
  SINK_URL=http://127.0.0.1:46311/ TRACE_LIFECYCLE=static|stream [DISABLE_CHANNEL_INJECTION=1] [SENTRY_DEBUG=1]

  runB.log   server.mjs,           injection OFF  -> boots, ZERO spans/transactions (only events)
  runD.log   dist-server2/server.mjs, injection OFF, static -> route transactions + db spans  <-- WORKS
  runE.log   dist-server2/server.mjs, injection OFF, stream -> span envelopes + db spans      <-- WORKS
  runF1.log  dist-server2/server.mjs, injection ON  -> boots (esbuild hoists the external mysql2 import above init) and works
  runG-injectON.log  dist-lazy/server.mjs, injection ON  -> SyntaxError: Unexpected token ':' (mysql2 connection_config.js:13)
  runH-injectOFF.log dist-lazy/server.mjs, injection OFF -> route transactions + db spans, order-independent  <-- WORKS
  runI-unbundled-off-stream.log server.mjs, injection OFF, stream -> no db spans either
  baseline-inject-on.log  server.mjs, injection ON (default) -> the reported startup crash

Key: build-time channel injection (esbuild + @sentry/server-utils/orchestrion/esbuild) replaces the
runtime module hook; `enableRuntimeChannelInjection: false` in Sentry.init() then keeps Deno from
compiling mysql2's `require('../package.json')` as JS.
