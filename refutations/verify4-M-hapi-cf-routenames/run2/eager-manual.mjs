import * as Sentry from '@sentry/cloudflare';
import { httpServerHandler } from 'cloudflare:node';
import { registerRoutes, server } from './routes.mjs';

const SINK = 'http://127.0.0.1:53911';

registerRoutes(Sentry, true);
const startPromise = server.start();
const nodeHandler = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.SENTRY_LIFECYCLE ?? 'static',
  }),
  {
    async fetch(request, env, ctx) {
      await startPromise;
      return nodeHandler.fetch(request, env, ctx);
    },
  },
);
