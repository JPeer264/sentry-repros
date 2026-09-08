import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';
import mysql from 'mysql';

const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const app = new Koa();
const router = new Router();

router.get('/db1', async ctx => {
  ctx.body = {
    rows: await new Promise((resolve, reject) =>
      conn.query('SELECT id, name FROM users', (err, rows) => (err ? reject(err) : resolve(rows))),
    ),
  };
});
router.get('/users/:id', ctx => {
  ctx.body = { id: ctx.params.id };
});
router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.body = { sentinel: true };
});

app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } }));
app.use(router.routes()).use(router.allowedMethods());
app.listen(8080);

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:52907/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    sendDefaultPii: true,
  }),
  httpServerHandler({ port: 8080 }),
);
