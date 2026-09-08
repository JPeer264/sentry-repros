import * as Sentry from '@sentry/cloudflare';
import { httpServerHandler } from 'cloudflare:node';
import { registerRoutes, server } from './routes.mjs';

const SINK = 'http://127.0.0.1:52417';

let started;
const nodeHandler = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.SENTRY_LIFECYCLE ?? 'static',
    debug: true,
  }),
  {
    async fetch(request, env, ctx) {
      started ??= (async () => {
        registerRoutes(Sentry);
        await server.start();
      })();
      await started;
      return nodeHandler.fetch(request, env, ctx);
    },
  },
);
