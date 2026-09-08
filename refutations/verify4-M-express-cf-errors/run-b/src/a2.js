import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { buildApp } from './routes.js';

let app;
let listening;
function ensureApp() {
  if (!listening) {
    app = buildApp();
    listening = new Promise(resolve => app.listen(8080, resolve));
  }
  return listening;
}

const inner = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:39411/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    sendDefaultPii: true,
    debug: true,
  }),
  {
    async fetch(request, env, ctx) {
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
