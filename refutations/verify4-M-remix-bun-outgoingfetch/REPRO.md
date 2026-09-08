# verify4-M-remix-bun-outgoingfetch

Remix v2.17.1 (vite plugin + @remix-run/express) + @sentry/remix 10.67.0 (develop) on bun 1.4.0.
Question: does `fetch()` from a loader get an `http.client` span and `sentry-trace`/`baggage` headers?

Answer:
- Bundled with `@sentry/bun/plugin` (Bun's documented instrumentation path): YES, fully, out of the
  box - nested under the `GET outfetch` transaction, headers complete, incoming trace continued.
- Plain `bun server.mjs`: NO by default (no span AND no headers - Bun's native fetch is untouched;
  the Node SDK's fetch instrumentation is undici-diagnostics-channel based and Bun publishes no
  undici channels). Fixed by `integrations: [fetchIntegration()]` from `@sentry/bun` plus the
  DEFAULT `traceLifecycle: 'stream'` (with `'static'` a parentless client span is dropped:
  `onlyIfParent` in packages/node/src/integrations/node-fetch/undici-instrumentation.ts:287 and
  `shouldEmitSpan` in packages/core/src/fetch.ts:106-113). The span is then its own segment
  (correct trace id / parent from the incoming header), never a child of a local http.server span,
  because @sentry/remix's `wrapRequestHandler` calls `continueTrace`, which does
  `withActiveSpan(null, ...)` (packages/core/src/tracing/trace.ts:218) and - with `instrumentTracing`
  unset on the Node/Bun path - never starts a replacement span.

## Install
  mkdir app && cd app   # package.json in this repo dir
  npm install
  npm install $REPRO/_toolbox/pack/sentry-remix-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-react-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-utils-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz $REPRO/_toolbox/pack/sentry-replay-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-replay-canvas-10.67.0.tgz $REPRO/_toolbox/pack/sentry-feedback-10.67.0.tgz
  bun x remix vite:build          # works unmodified on bun
  bun build-server.ts             # only for the bundled mode -> app/dist/server.js

## Run
  PORT=41231 node app/sink2.mjs > sink.log 2>&1 &
  REC_PORT=41232 node app/recorder.mjs > rec.log 2>&1 &
  ./run.sh <label> <baseline|bunfetch|bunall> <static|stream> ["bun server.mjs" | "bun dist/server.js" | "node --import ./instrument.mjs server.mjs"]

`run.sh` hits /outfetch?rec=41232, three concurrent /iso/{a,b,c}, /users/42 and /sentinel
(captureMessage + flush), then dumps the sink and the recorded request headers.

## Results (items-<label>.json, rec-<label>.json)
  baseline-static   plain bun, @sentry/remix defaults, traceLifecycle static  -> no span, no headers
  baseline-stream   plain bun, defaults, stream                               -> no span, no headers
  bunfetch-static   + fetchIntegration() from @sentry/bun, static             -> headers only, client_report(no_parent_span)
  bunfetch-stream   + fetchIntegration(), stream (SDK default)                -> http.client span + full headers
  bunall-static     + fetchIntegration() + bunHttpServerIntegration(), static -> http.server transactions, still no client span
  bunall-stream     both integrations, stream                                 -> http.server + http.client, separate segments
  bundle-static     bun dist/server.js (sentryBunPlugin), static              -> full tree, client span nested
  node-import-static  node --import ./instrument.mjs server.mjs (reference)   -> full tree, client span nested

## Files
  app/instrument.mjs      PROBE_VARIANT / PROBE_LIFECYCLE switch
  app/server.mjs          express adapter, `import './instrument.mjs'` first line
  app/build-server.ts     Bun.build + sentryBunPlugin()
  app/app/routes/outfetch.tsx, iso.$id.tsx, users.$id.tsx, sentinel.tsx
  app/recorder.mjs        echoes sentry-trace / baggage of the incoming /rec request
  app/sink2.mjs           copy of $REPRO/_toolbox/sink.mjs
  app-<label>.log, items-<label>.json, rec-<label>.json
