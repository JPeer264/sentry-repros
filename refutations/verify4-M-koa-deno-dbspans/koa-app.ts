import Koa from 'koa';
import Router from '@koa/router';
import * as Sentry from '@sentry/deno';

// eslint-disable-next-line
export function makeApp(query: (sql: string) => Promise<unknown>) {
  const app = new Koa();
  const router = new Router();

  router.get('/db', async ctx => {
    const rows = await query('SELECT name FROM users LIMIT 1');
    ctx.body = { rows };
  });

  router.get('/db-in-span', async ctx => {
    const rows = await Sentry.startSpan({ name: 'wrapper', op: 'manual' }, async () => {
      return await query('SELECT name FROM users LIMIT 1');
    });
    ctx.body = { rows };
  });

  router.get('/manual', async ctx => {
    const active = Sentry.getActiveSpan();
    await Sentry.startSpan({ name: 'manual-child', op: 'manual' }, async () => {
      await new Promise(r => setTimeout(r, 5));
    });
    ctx.body = { hadActiveSpan: !!active, rootName: active ? Sentry.spanToJSON(Sentry.getRootSpan(active)).description : null };
  });

  router.get('/sentinel', ctx => {
    Sentry.captureMessage('sentinel');
    ctx.body = 'ok';
  });

  app.use(router.routes()).use(router.allowedMethods());
  app.on('error', err => {
    Sentry.captureException(err, { mechanism: { type: 'manual.koa.onerror', handled: false } });
  });
  return app;
}
