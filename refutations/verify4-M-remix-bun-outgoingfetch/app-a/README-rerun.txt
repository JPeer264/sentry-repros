verify4-M-remix-bun-outgoingfetch  (Remix v2.17.4 + @sentry/remix 10.67.0 develop, Bun 1.4.0)

Install (npm, NOT bun add):
  S=<scratchpad>
  cd app-a
  npm install --no-audit --no-fund \
    $REPRO/_toolbox/pack/sentry-remix-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-react-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-utils-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
    @remix-run/dev@2.17.4 @remix-run/express@2.17.4 @remix-run/node@2.17.4 @remix-run/react@2.17.4 \
    @remix-run/server-runtime@2.17.4 express@4.21.2 react@18.3.1 react-dom@18.3.1 vite@5.4.11 \
    isbot@4.4.0 mysql2@3.11.5

Helpers (pick free ports 20000-60000):
  PORT=33517 node $REPRO/_toolbox/sink.mjs > sink-a.log 2>&1 &
  PORT=33519 node ./recorder.mjs > recorder-a.log 2>&1 &

Build:
  bun x remix vite:build            # remix client+server build
  bun build-server.ts               # Bun.build + sentryBunPlugin -> dist/server.js
  KEEP_REMIX_EXTERNAL=1 OUTDIR=./dist-ext bun build-server.ts   # mode F only

Runs (all with NODE_ENV=production PORT=33518 SINK_URL=http://127.0.0.1:33517/ RECORDER_URL=http://127.0.0.1:33519):
  A  bun server.mjs                                     plain, no bundle
  C  VARIANT_ISOLATION=1 bun dist/server.js             bundle + isolation express middleware calling next()
  D  VARIANT_ISOLATION=2 bun dist/server.js             bundle + wrap the remix express handler  <-- THE FIX
  E  VARIANT_ISOLATION=2 TRACE_LIFECYCLE=stream bun dist/server.js
  F  bun dist-ext/server.js                             bundle with @remix-run/* re-externalized

Drive:
  curl http://127.0.0.1:33518/outfetch
  curl -H 'sentry-trace: dddddddddddddddddddddddddddddddd-4444444444444444-1' \
       -H 'baggage: sentry-trace_id=dddddddddddddddddddddddddddddddd' http://127.0.0.1:33518/outfetch
  3x concurrent /iso/a /iso/b /iso/c with distinct sentry-trace headers
  curl http://127.0.0.1:33518/sentinel      # sentinel, then read the sink
  curl http://127.0.0.1:33517/__items ; curl http://127.0.0.1:33519/__recs

Result:
  A  headers only, zero transaction/span envelopes; isolation + continueTrace correct
  C  full spans, isolation STILL broken (next() loses the ALS context) - do not document this shape
  D  full spans AND isolation AND incoming trace continuation AND outgoing-fetch headers
  E  same as D on the default stream lifecycle
  F  isolation back, spans gone (same as A) - re-externalizing @remix-run/* is not a fix
