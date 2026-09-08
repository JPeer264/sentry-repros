verify4-M-remix-bun-isolation — refutation of "Remix v2 on Bun: isolation broken in the bundled mode"

S=$SCRATCH
D=$REPRO/refutations/verify4-M-remix-bun-isolation

Install (if node_modules is gone):
  cd $D && npm install --no-audit --no-fund \
    $REPRO/_toolbox/pack/sentry-remix-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-react-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-utils-10.67.0.tgz \
    '@remix-run/dev@^2.17.4' '@remix-run/express@^2.17.4' '@remix-run/node@^2.17.4' '@remix-run/react@^2.17.4' \
    '@remix-run/server-runtime@^2.17.4' express@^4.21.2 react@^18.2.0 react-dom@^18.2.0 isbot@^4.1.0 vite@^5.4.11 mysql2

  IMPORTANT: package.json must NOT contain "sideEffects": false. With it, `Bun.build` tree-shakes the
  bare `import './instrument.mjs'` out of the server bundle and Sentry never initializes (silently).

Build the Remix app:      cd $D && bun x remix vite:build
Start the sink:           PORT=27431 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &

Bundle a server entry:    cd $D && ENTRY=./server-iso4.mjs OUTDIR=./dist-a6 bun build-server.ts
Run it:                   NODE_ENV=production PORT=27433 SINK_URL=http://127.0.0.1:27431/ bun dist-a6/server-iso4.js
Drive it:                 node drive-iso.mjs          (3 concurrent /iso/{a,b,c} + /sentinel)
                          node drive-trace.mjs        (same, with distinct incoming sentry-trace headers)
Read the sink:            curl -s http://127.0.0.1:27431/__items

Entries, in the order they were tried:
  server.mjs        stock express adapter (the Node docs shape)          -> Mode B repro: BROKEN isolation
  server-iso.mjs    express middleware: withIsolationScope(() => next()) -> still BROKEN (does not survive next())
  server-iso2.mjs   wrap the handler: withIsolationScope(async () => await handler(...)) -> isolation FIXED
  server-iso3.mjs   + continueTrace                                      -> incoming trace continuation FIXED
  server-iso4.mjs   + normalizedRequest on the isolation scope           -> request data on events FIXED  <= the recipe
  EXTRA_EXTERNAL='@remix-run/express' bun build-server.ts                -> isolation FIXED but ALL spans lost

Side finding (root cause, checked directly):
  bun /tmp/x_dc2.mjs  ->  CHANNEL_FIRED= 0     (Bun 1.4.0 node:http publishes no diagnostics_channel events)
  node /tmp/x_dc2.mjs ->  CHANNEL_FIRED= 1
  i.e. `@sentry/node`'s httpServerIntegration (isolation + trace continuation, subscribes to
  'http.server.request.start') is inert on Bun for every node:http framework, not just Remix.
