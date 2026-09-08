import Koa from 'koa';
import Router from '@koa/router';

export function createApp() {
  const app = new Koa();
  const router = new Router();
  router.get('/', ctx => { ctx.body = { ok: true }; });
  router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });
  router.get('/boom/:id', ctx => { throw new Error(`koa-cf boom ${ctx.params.id}`); });
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
