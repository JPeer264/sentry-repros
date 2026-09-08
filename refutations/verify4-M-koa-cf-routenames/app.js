import Koa from 'koa';
import Router from '@koa/router';
import * as Sentry from '@sentry/cloudflare';

export function buildApp() {
  const app = new Koa();
  const router = new Router();

  router.get('/plain', ctx => { ctx.body = { ok: true }; });
  router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });
  router.get('/api/orders/:orderId/items/:itemId', ctx => { ctx.body = { ...ctx.params }; });

  router.get('/named/:id', ctx => {
    const active = Sentry.getActiveSpan();
    const root = active ? Sentry.getRootSpan(active) : undefined;
    let applied = 'no-active-span';
    if (root) {
      const route = String(ctx._matchedRoute ?? ctx.path);
      Sentry.updateSpanName(root, `${ctx.method} ${route}`);
      root.setAttribute('http.route', route);
      applied = route;
    }
    ctx.body = { applied };
  });

  router.get('/boom/:id', () => { throw new Error('koa-cf boom'); });

  router.get('/sentinel', ctx => {
    Sentry.captureMessage('sentinel');
    ctx.body = { ok: true };
  });

  app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } }));
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
