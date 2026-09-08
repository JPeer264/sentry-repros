import Koa from 'koa';
import Router from '@koa/router';
import * as Sentry from '@sentry/cloudflare';

export function buildApp() {
  const app = new Koa();
  const router = new Router();

  router.get('/plain', ctx => {
    ctx.body = { ok: true };
  });
  router.get('/users/:id', ctx => {
    ctx.body = { id: ctx.params.id };
  });
  router.get('/probe', ctx => {
    const active = Sentry.getActiveSpan();
    const root = active ? Sentry.getRootSpan(active) : undefined;
    ctx.body = {
      hasActiveSpan: !!active,
      rootName: root ? Sentry.spanToJSON(root).description : null,
      rootAttrs: root ? Sentry.spanToJSON(root).data : null,
      matchedRoute: ctx._matchedRoute ?? null,
    };
  });
  router.get('/boom/:id', () => {
    throw new Error('koa-cf boom');
  });
  router.get('/sentinel', ctx => {
    Sentry.captureMessage('sentinel');
    ctx.body = { ok: true };
  });

  const orders = new Router({ prefix: '/api/orders' });
  orders.get('/:orderId/items/:itemId', ctx => {
    ctx.body = { ...ctx.params };
  });

  app.use(router.routes()).use(router.allowedMethods());
  app.use(orders.routes()).use(orders.allowedMethods());

  return app;
}
