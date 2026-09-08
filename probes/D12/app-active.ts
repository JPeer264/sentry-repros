import { Application, Router } from '@oak/oak';
import * as Sentry from '@sentry/deno';

export function runApp(): Promise<void> {
  const APP_PORT = Number(Deno.env.get('APP_PORT'));

  const router = new Router();

  router.get('/active', ctx => {
    const active = Sentry.getActiveSpan();
    ctx.response.body = {
      activeSpan: active ? active.spanContext().traceId : null,
      isolationTrace: Sentry.getIsolationScope().getPropagationContext().traceId,
    };
  });

  router.get('/sentinel', ctx => {
    Sentry.captureMessage('sentinel');
    ctx.response.body = 'ok';
  });

  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app.listen({ port: APP_PORT, hostname: '127.0.0.1' });
}
