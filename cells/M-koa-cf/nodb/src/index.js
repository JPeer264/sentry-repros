import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';



const RECORDER_PORT = 41337;

const app = new Koa();
const router = new Router();

router.get('/users/:id', ctx => {
  ctx.body = { id: ctx.params.id };
});

// manual route naming attempt
router.get('/named/:id', ctx => {
  const span = Sentry.getActiveSpan();
  if (span) {
    Sentry.updateSpanName(Sentry.getRootSpan(span), `${ctx.method} ${ctx.routerPath || ctx._matchedRoute}`);
  }
  ctx.body = { named: !!span, matched: ctx._matchedRoute };
});

router.get('/boom/:id', () => {
  throw new Error('koa-cf boom');
});

router.get('/tag/:t', async ctx => {
  const t = ctx.params.t;
  Sentry.setTag('reqtag', t);
  await new Promise(r => setTimeout(r, 30 + Math.floor(Math.random() * 60)));
  Sentry.captureException(new Error(`tagged-${t}`));
  ctx.body = { tagged: t };
});

router.get('/outgoing', async ctx => {
  const res = await fetch(`http://127.0.0.1:${RECORDER_PORT}/rec`);
  ctx.body = await res.json();
});

router.get('/log', ctx => {
  Sentry.logger.info('koa-cf log line', { where: 'handler' });
  ctx.body = { logged: true };
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.body = { s: 1 };
});

app.on('error', err => {
  Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } });
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(8080);

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:41318/',
    tracesSampleRate: 1.0,
    traceLifecycle: env.TRACE_LIFECYCLE === 'static' ? 'static' : 'stream',
  }),
  httpServerHandler({ port: 8080 }),
);
