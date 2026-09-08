// Deno Deploy proxy (simulated). On Deno Deploy `Deno.permissions.querySync` is not
// exposed while `Deno.permissions.query` still resolves through the same object, so
// the native `query` implementation reaches for `this.querySync` and fails. The Proxy
// below reproduces that shape locally.
import * as Sentry from '@sentry/deno';
import { boom } from './src/boom.ts';

const realPermissions = Deno.permissions;
Object.defineProperty(Deno, 'permissions', {
  configurable: true,
  value: new Proxy(realPermissions, {
    get(target, prop) {
      if (prop === 'querySync') return undefined;
      return Reflect.get(target, prop, target);
    },
  }),
});

const SINK_PORT = Number(Deno.args[0]);
const APP_PORT = Number(Deno.args[1]);

Sentry.init({
  dsn: 'https://abc123@o0.ingest.sentry.io/1337',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  release: 'n1-release@1.0.0',
  environment: 'n1-environment',
});

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1', onListen: () => console.log(`LISTENING ${APP_PORT}`) }, async (req) => {
  const url = new URL(req.url);
  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    await Sentry.flush(3000);
    return new Response('sentinel\n');
  }
  boom();
});
