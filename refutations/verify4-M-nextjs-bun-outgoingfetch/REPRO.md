# verify4-M-nextjs-bun-outgoingfetch

Next.js 15.5.4 (app router) + @sentry/nextjs 10.67.0 (develop) on bun 1.4.0, `bun --bun next build/start`.

Ports: sink 41821, recorder 41822, app 41823.

## Install
    cd app
    npm install --no-audit --no-fund next@15.5.4 react@19.1.0 react-dom@19.1.0 typescript@5.9.2 \
      @types/node@20 @types/react@19 @types/react-dom@19 \
      $REPRO/_toolbox/pack/sentry-{nextjs,node,core,opentelemetry,server-utils,server-runtime-injection,react,browser,browser-utils,bundler-plugins,vercel-edge,bun,feedback,replay,replay-canvas}-10.67.0.tgz

## Run
    PORT=41821 node ../sink.mjs > ../sink.log 2>&1 &
    PORT=41822 node ../recorder.mjs > ../recorder.log 2>&1 &
    PROBE_TUNNEL=http://127.0.0.1:41821/ PROBE_RECORDER=http://127.0.0.1:41822/hit bun --bun ./node_modules/.bin/next build
    PROBE_TUNNEL=http://127.0.0.1:41821/ PROBE_RECORDER=http://127.0.0.1:41822/hit bun --bun ./node_modules/.bin/next start -p 41823
    curl -s http://127.0.0.1:41823/api/fetchout
    curl -s http://127.0.0.1:41823/api/sentinel      # sentinel, everything before it has arrived
    curl -s http://127.0.0.1:41822/__hits
    curl -s http://127.0.0.1:41821/__items

## The change that fixes outgoing fetch
`app/sentry.server.config.ts`:

    import { fetchIntegration } from '@sentry/bun';
    import * as Sentry from '@sentry/nextjs';

    Sentry.init({ dsn, tracesSampleRate: 1.0, integrations: [fetchIntegration()] });

Requires `@sentry/bun` as a dependency of the Next.js app.

Logs kept: server-baseline.log (no fetchIntegration), server-fix.log (traceLifecycle static + fetchIntegration),
server-stream.log (default stream lifecycle + fetchIntegration).
