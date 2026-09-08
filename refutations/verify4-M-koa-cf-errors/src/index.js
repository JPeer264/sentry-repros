import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();
router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });
router.get('/boom/:id', () => { throw new Error('koa-cf boom'); });
router.get('/sentinel', ctx => { Sentry.captureMessage('sentinel'); ctx.body = { s: 1 }; });
router.get('/integrations', ctx => {
  const c = Sentry.getClient();
  ctx.body = {
    integrations: c ? Object.keys(c._integrations ?? {}) : null,
    orchestrionIntegrations: [...(globalThis.__SENTRY_ORCHESTRION__?.integrations?.keys?.() ?? [])],
    koaHandlerAttached: !!app.__SENTRY_KOA_ERROR_HANDLER_ATTACHED__,
    errorListeners: app.listenerCount('error'),
  };
});
app.use(router.routes()).use(router.allowedMethods());
app.listen(8080);

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:44711/',
    tracesSampleRate: 1.0,
    debug: env.SENTRY_DEBUG === '1',
    traceLifecycle: env.TRACE_LIFECYCLE === 'static' ? 'static' : 'stream',
  }),
  httpServerHandler({ port: 8080 }),
);
