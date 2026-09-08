verify4-M-remix-bun-dbspans — Remix v2 + @sentry/remix 10.67.0 (develop) on Bun 1.4.0

Install (npm, not `bun add`):
  S=<scratchpad>
  npm install --legacy-peer-deps \
    $S/pack/sentry-{remix,node,core,react,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry,bun}-10.67.0.tgz \
    '@remix-run/dev@^2.17.0' '@remix-run/express@^2.17.0' '@remix-run/node@^2.17.0' \
    '@remix-run/react@^2.17.0' '@remix-run/server-runtime@^2.17.0' \
    'express@^4.21.2' react react-dom vite@^5 mysql2 typescript

  IMPORTANT: package.json must NOT carry "sideEffects": false. With it, Bun.build tree-shakes
  the side-effect-only `import './db.mjs'` out of the server bundle and mysql2 is never
  transformed (silently: no db spans, no error).

Build the app:            bun x remix vite:build

Mode A (plain, docs wiring):   NODE_ENV=production SINK_URL=... PORT=27852 bun server.mjs
Mode B (Sentry Bun plugin):    bun build-server.ts   && ... bun dist/server.js
Mode B + express external:     bun build-noshim.ts   && ... bun dist-noshim/server.js
FINAL (db spans + isolation):  bun build-final.ts    && ... bun dist-final/server-final.js

Minimal express ALS A/B:       bun build-mini.ts; bun dist-mini-a/mini.js (broken)
                                                  bun dist-mini-b/mini.js (correct)
Plain diagnostics_channel bindStore probe (works on both node and bun):
                               node dc-bindstore-probe.mjs ; bun dc-bindstore-probe.mjs

Sink: PORT=27851 node $S/qs/sink.mjs
