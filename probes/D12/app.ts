import { Application, Router } from '@oak/oak';
import * as Sentry from '@sentry/deno';

export function runApp(): Promise<void> {
  const APP_PORT = Number(Deno.env.get('APP_PORT'));
  const withErrorListener = Deno.env.get('OAK_ERROR_LISTENER') === '1';

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

  return app.listen({ port: APP_PORT, hostname: '127.0.0.1' });
}
