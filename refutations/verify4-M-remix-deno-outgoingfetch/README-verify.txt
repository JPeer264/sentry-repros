verify4-M-remix-deno-outgoingfetch  ---  REFUTES "outgoing fetch broken" for Remix v2 on Deno 2.9.0

SDK: develop tarballs 10.67.0 from $S/pack. Remix 2.17.5, Deno 2.9.0, nodeModulesDir "manual".

Install / build (under node):
  npm install --legacy-peer-deps $S/pack/sentry-{remix,node,core,react,browser,browser-utils,replay,\
    replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz \
    '@remix-run/dev@^2.17.0' '@remix-run/node@^2.17.0' '@remix-run/react@^2.17.0' \
    '@remix-run/server-runtime@^2.17.0' react react-dom vite@^5 mysql2 undici axios typescript
  npx remix vite:build

Sink + recorder (node):  PORT=44311 node sink.mjs ;  PORT=44312 node recorder2.mjs

THE FIX: app/entry.server.tsx must call installGlobals() from '@remix-run/node'
(the stock Remix entry, same as dev-packages/e2e-tests/test-applications/create-remix-app-v2).
The previous probe omitted it. Deno's native global fetch is not instrumentable (K2), but Remix's
own installGlobals() replaces globalThis.fetch/Request/Response with the node:http-backed
@remix-run/web-fetch polyfill, and the Node SDK's http client instrumentation DOES work on Deno.

runG (final, documented wiring) -- unchanged server entry, installGlobals() in entry.server.tsx:
  PORT=44336 RECORDER_PORT=44312 SINK_URL=http://127.0.0.1:44311/ TRACE_LIFECYCLE=static \
    deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server-dbfirst.mjs

ORDERING RULE (matters): if you instead call installGlobals() in the *server entry*, it must run
AFTER `import './instrument.server.mjs'`. Calling it before Sentry.init() silently drops every
transaction/span envelope for the whole process (runB, runF) while errors still arrive.
  server-flex.mjs + probe.sh reproduce both orders:
    ./probe.sh runC 44332 after  1   -> works (nativeFetch: true, undici globals)
    ./probe.sh runD 44333 after  0   -> works (default web-fetch globals)
    ./probe.sh runF 44335 before 0   -> BROKEN: no transactions at all
  runE = after + TRACE_LIFECYCLE=stream -> works too.

runA = baseline without installGlobals: /out?kind=fetch gets no span and no headers (K2),
but /out?kind=nodehttp and /out?kind=undici DO get http.client spans + headers, which is what
pointed at the polyfill as the fix.
