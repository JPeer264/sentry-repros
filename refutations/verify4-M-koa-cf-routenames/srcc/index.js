import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { buildApp } from '../app.js';

let listening;
function ensureApp() {
  if (!listening) {
    listening = new Promise(resolve => buildApp().listen(8080, resolve));
  }
  return listening;
}

const inner = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:51733/',
    tracesSampleRate: 1.0,
    traceLifecycle: env.LIFECYCLE === 'static' ? 'static' : 'stream',
    debug: true,
  }),
  {
    async fetch(request, env, ctx) {
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
