# verify4-M-reactrouter-bun-outgoingfetch

React Router 8 (framework mode, node-custom-server template) + @sentry/react-router 10.67.0 (develop)
on bun 1.4.0. Question: does `fetch()` from a loader get an `http.client` span and
`sentry-trace`/`baggage` headers?

Answer: not with default integrations. YES after adding `fetchIntegration()` from `@sentry/bun`
(headers, plus the span when `traceLifecycle: 'stream'`), and fully (server parent span + child
http.client span + isolation) after also adding `bunHttpServerIntegration()`.

## Install
  npx create-react-router@latest ./app --template remix-run/react-router-templates/node-custom-server --no-git-init --no-install --yes
  cd app && npm install
  npm install $REPRO/_toolbox/pack/sentry-react-router-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-react-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz
  npx react-router reveal   # then rewrite app/entry.server.tsx for renderToReadableStream (Bun)
  npx react-router build    # build with node

## Run
  PORT=47811 node $REPRO/_toolbox/sink.mjs &
  REC_PORT=47812 node app/recorder.mjs &
  cd app && SINK_PORT=47811 PORT=47813 PROBE_VARIANT=<baseline|bunfetch|bunall> \
    PROBE_LIFECYCLE=<static|stream> bun server.js &
  curl "http://127.0.0.1:47813/fetchout?rec=47812"   # loader fetches the recorder
  curl "http://127.0.0.1:47813/flush"                # sentinel + flush
  curl http://127.0.0.1:47811/__items

## Files
  app/instrument.server.mjs  variant switch (bun fetchIntegration / bunHttpServerIntegration)
  app/app/routes/fetchout.tsx, app/app/routes/flush.tsx
  app/app/entry.server.tsx   Bun-compatible renderToReadableStream + wrapSentryHandleRequest
  app/recorder.mjs           header echo endpoint
  app-baseline.log, app-bunfetch.log, app-bunfetch-stream.log, app-bunall-static.log, app-bunall-stream.log
  rec.log                    recorded request headers per run
