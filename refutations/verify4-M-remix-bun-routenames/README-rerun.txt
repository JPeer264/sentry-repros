verify4-M-remix-bun-routenames - Remix v2 route names on Bun 1.4.0, @sentry/remix 10.67.0 (develop)

INSTALL (node_modules may have been cleaned)
  S=$SCRATCH
  cd $REPRO/refutations/verify4-M-remix-bun-routenames
  npm install --no-audit --no-fund \
    $REPRO/_toolbox/pack/sentry-remix-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-react-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-utils-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
    @remix-run/dev@2.17.4 @remix-run/express@2.17.4 @remix-run/node@2.17.4 @remix-run/react@2.17.4 \
    @remix-run/server-runtime@2.17.4 express@4.21.2 isbot@4.1.0 react@18.3.1 react-dom@18.3.1 vite@5.4.11
  npx remix vite:build

  IMPORTANT: package.json must NOT contain "sideEffects": false. With it, Bun.build tree-shakes
  `import './instrument-*.mjs'` out of the bundle entirely and the SDK never initializes
  (silent - the server starts and emits nothing).

SINK
  PORT=53821 node sink.mjs > sink.log 2>&1 &
  curl -s http://127.0.0.1:53821/__items ; curl -s -X DELETE http://127.0.0.1:53821/__items

MODES
  A  (plain, no bundle)          NODE_ENV=production PORT=41318 SINK_URL=http://127.0.0.1:53821/ bun server-a.mjs
  A2 (plain + instrumentBuild)   ... INSTRUMENT_BUILD=1 bun server-a.mjs
  C  (plain + bunHttpServer)     ... bun server-c.mjs        [instrument-c.mjs adds bunHttpServerIntegration()]
  D  (active-span probe in mw)   ... bun server-d.mjs
  NODE control                   ... node server-a.mjs
  B  (bundle, as reported)       BUNDLE_ENTRY=./server-a.mjs BUNDLE_OUT=./dist-b bun build-server.ts
                                 ... bun dist-b/server-a.js
  E  (bundle + isolation FIX)    BUNDLE_ENTRY=./server-e.mjs BUNDLE_OUT=./dist-e bun build-server.ts
                                 ... bun dist-e/server-e.js
                                 [instrument-e.mjs: integrations: [bunHttpServerIntegration({ spans: false })]]
  Add TRACE_LIFECYCLE=stream for span envelopes, SENTRY_DEBUG=1 for SDK debug logs.

DRIVERS (separate node process, never the app process)
  APP_URL=http://127.0.0.1:41318 node drive.mjs /users/42 /boom/7 /sentinel
  APP_URL=http://127.0.0.1:41318 node drive-iso.mjs      # 3 concurrent /iso/{a,b,c} + sentinel
  APP_URL=http://127.0.0.1:41318 node drive-trace.mjs    # incoming sentry-trace continuation
  curl -s -H 'accept: application/json' 'http://127.0.0.1:41318/probe?_data=routes%2Fprobe'

RESULT
  A / A2 / C  : no route names (see run-a.log, run-a2.log, run-c*.log and the sink dumps in the report)
  B           : route names OK, isolation broken (one trace id, tags leak)
  E           : route names OK, isolation OK, incoming trace continued  <-- the fix

NOTE: files named mode*.log / mode*.pid / drive.sh / node-control.log / sink.pid in this directory are
leftovers from an earlier run at the same path (timestamps ~19:05); this probe's files are
instrument-{a,c,e}.mjs, server-{a,c,d,e}.mjs, run-*.log, dist-{a,b,e}/, drive*.mjs, README-rerun.txt.
dist-a/ is the tree-shaken bundle built while package.json still had "sideEffects": false - it starts
but initializes no SDK; kept as evidence.
