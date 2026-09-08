# verify4-M-nextjs-deno-outgoingfetch

Refutes: "Next.js 15 on Deno produces no http.client span and no trace headers for outgoing fetch."

Setup (once):
  npm install --no-audit --no-fund next@15.5.4 react@19.1.0 react-dom@19.1.0 $REPRO/_toolbox/pack/sentry-{nextjs,node,core,opentelemetry,react,browser,browser-utils,server-utils,server-runtime-injection,vercel-edge,bundler-plugins,replay,replay-canvas,feedback}-10.67.0.tgz

Run:
  PORT=41611 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &
  PORT=41612 node recorder.mjs > rec.log 2>&1 &
  SINK_PORT=41611 RECORDER_PORT=41612 deno run -A node_modules/next/dist/bin/next build
  SINK_PORT=41611 RECORDER_PORT=41612 deno run -A node_modules/next/dist/bin/next start -p 41618 &
  curl -s http://127.0.0.1:41618/api/fetch
  curl -s http://127.0.0.1:41612/__hits
  curl -s http://127.0.0.1:41611/__items

Note: a failed `next build` leaves a corrupt distDir; the next build then dies with
"SyntaxError: Unexpected end of input" while collecting page data. Bump `distDir` in
next.config.mjs to a fresh name rather than debugging the config.

Files:
  sentry.server.config.js        final: integrations: [winterCGFetchIntegration()]
  sentry-fetch-integration.js    equivalent hand-rolled @sentry/core variant (also verified)
  server-a.log / sink-a.log      baseline, no fetch integration -> no http.client span, no headers
  server-wcg.log                 winterCGFetchIntegration, traceLifecycle static
  server-wcg-stream.log          winterCGFetchIntegration, traceLifecycle stream
