import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { setupExpressErrorHandler } from '@sentry/server-utils';
import express from 'express';
import { addRoutes } from './routes.js';

let listening;
function ensureApp() {
  if (!listening) {
    const app = express();
    addRoutes(app, Sentry);
    setupExpressErrorHandler(app);
    listening = new Promise(r => app.listen(8080, r));
  }
  return listening;
}
const inner = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:47311/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    sendDefaultPii: true,
  }),
  {
    async fetch(request, env, ctx) {
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
