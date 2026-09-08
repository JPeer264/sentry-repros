import { Application, Router } from '@oak/oak';
import * as Sentry from '@sentry/cloudflare';
import mysql from 'mysql2/promise';
import mysql1 from 'mysql';

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
const pool1 = mysql1.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

const SINK = 'http://127.0.0.1:41538';

const router = new Router();

router.get('/', ctx => {
  ctx.response.body = { ok: true };
});

router.get('/users/:id', ctx => {
  ctx.response.body = { id: ctx.params.id };
});

router.get('/error/:id', () => {
  throw new Error('oak-route-boom');
});

router.get('/isolate/:tag', async ctx => {
  const tag = ctx.params.tag!;
  Sentry.setTag('req_tag', tag);
  await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 50)));
  Sentry.captureException(new Error(`iso-${tag}`));
  ctx.response.body = { tag };
});

router.get('/fetch', async ctx => {
  const res = await fetch(`${SINK}/__record?from=oak`);
  ctx.response.body = { downstream: await res.json() };
});

router.get('/log', ctx => {
  Sentry.logger.info('oak-log-from-handler', { where: 'handler' });
  ctx.response.body = { logged: true };
});

router.get('/db', async ctx => {
  const [rows] = await pool.query('SELECT id, name FROM users');
  ctx.response.body = { rows };
});

router.get('/db1', async ctx => {
  const rows = await new Promise((resolve, reject) => {
    pool1.query('SELECT id, name FROM users', (err: unknown, res: unknown) => (err ? reject(err) : resolve(res)));
  });
  ctx.response.body = { rows };
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.response.body = { sentinel: true };
});

const app = new Application();
app.use(async (ctx, next) => {
  await next();
  const matched = (ctx as unknown as { matched?: Array<{ path: string }> }).matched;
  const path = matched?.[matched.length - 1]?.path;
  const span = Sentry.getActiveSpan();
  if (path && span) {
    Sentry.updateSpanName(Sentry.getRootSpan(span), `${ctx.request.method} ${path}`);
    Sentry.getRootSpan(span).setAttribute('sentry.source', 'route');
  }
});
app.use(router.routes());
app.use(router.allowedMethods());

export default Sentry.withSentry(
  (env: Record<string, string>) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: (env.SENTRY_LIFECYCLE as 'stream' | 'static') ?? 'static',
    debug: true,
  }),
  {
    fetch(request: Request, env: unknown, ctx: ExecutionContext) {
      return app.fetch(request, env, ctx);
    },
  } satisfies ExportedHandler,
);
