import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import { buildApp } from '../routes2.js';

let listening;
function ensureApp() {
  if (!listening) {
    const app = buildApp({ withWorkaround: false });
    listening = new Promise(resolve => app.listen(8080, resolve));
  }
  return listening;
}

const inner = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:53177/',
    tracesSampleRate: 1.0,
    traceLifecycle: env.LIFECYCLE === 'stream' ? 'stream' : 'static',
  }),
  {
    async fetch(request, env, ctx) {
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
