verify4-M-remix-cf-errors : Remix v2 (2.17.5, Remix Vite plugin) on Cloudflare Workers, develop SDK 10.67.0

Install (from this dir):
  npm install --legacy-peer-deps @remix-run/cloudflare@^2.17.5 @remix-run/react@^2.17.5 @remix-run/dev@^2.17.5 \
    react@^18.3.1 react-dom@^18.3.1 isbot@^4 vite@^6.4.3 wrangler@^4 \
    $S/pack/sentry-{remix,cloudflare,core,node,react,browser,browser-utils,replay,replay-canvas,feedback,server-utils,server-runtime-injection,opentelemetry,bundler-plugins}-10.67.0.tgz
  NOTE: isbot@4 has no default export -> use `import { isbot } from 'isbot'`.

Build + run:
  npx remix vite:build            # plain `vite build` skips build/server under Vite 6
  PORT=47318 node $S/qs/sink.mjs > sink.log 2>&1 &
  npx wrangler dev --port 47319 --inspector-port 0 > wrangler-A.log 2>&1 &

Probe routes: app/routes/boom.$id.tsx (loader throw Error), boomresp.$id.tsx (loader throw Response 500),
api.boom.tsx (resource route throw Error), act.tsx (action throw Error), sentinel.tsx (captureMessage sentinel).

Variants exercised (edit app/entry.server.tsx / server.ts, then `npx remix vite:build`; wrangler hot-reloads):
  A  no handleError at all                                       -> only the thrown Response is captured
  B  export const handleError = sentryHandleError                 (from '@sentry/remix/cloudflare') -> all 4 captured
  R2 no entry.server export; server.ts sets
     instrumented.entry.module.handleError = sentryHandleError    -> all 4 captured
  S  R2 + traceLifecycle removed (stream default)                 -> captured, span envelopes
  DOCS  entry.server.tsx: import * as Sentry from '@sentry/remix' -> handleError is undefined, NOTHING captured
        (rollup warns: "sentryHandleError" is not exported by node_modules/@sentry/remix/build/esm/index.client.js)
