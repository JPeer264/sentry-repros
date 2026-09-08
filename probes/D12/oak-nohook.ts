// Single-file layout: `Sentry.init` sits in the same module as the Oak import, so ESM
// hoisting evaluates Oak (which binds `globalThis.Deno.serve`) before `init` runs.
import { Application, Router } from '@oak/oak';
import * as Sentry from '@sentry/deno';

const APP_PORT = Number(Deno.env.get('APP_PORT'));
const SINK_PORT = Number(Deno.env.get('SINK_PORT'));
const withErrorListener = Deno.env.get('OAK_ERROR_LISTENER') === '1';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
});

const router = new Router();
router.get('/user/:id', ctx => {
  ctx.response.body = { user: ctx.params.id };
});
router.get('/error', () => {
  throw new Error('oak route boom');
});
router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.response.body = 'ok';
});

const app = new Application();
if (withErrorListener) {
  app.addEventListener('error', evt => {
    Sentry.captureException(evt.error);
  });
}
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: APP_PORT, hostname: '127.0.0.1' });
