import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';
import mysql from 'mysql';

const app = new Koa();
const router = new Router();

router.get('/users/:id', ctx => {
  ctx.body = { id: ctx.params.id };
});

router.get('/db', async ctx => {
  const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
  conn.on('error', () => {});
  const rows = await new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err, res) => {
      if (err) return reject(err);
      conn.query('SELECT COUNT(*) AS c FROM users', (err2, res2) => {
        conn.end();
        if (err2) return reject(err2);
        resolve([res, res2]);
      });
    });
  });
  ctx.body = { rows };
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.body = { ok: true };
});

app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } }));

const inner = httpServerHandler({ port: 8081 });

let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  app.use(router.routes()).use(router.allowedMethods());
  app.listen(8081);
}

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@localhost/1',
    tunnel: 'http://127.0.0.1:52713/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
  }),
  {
    fetch(request, env, ctx) {
      ensureStarted();
      return inner.fetch(request, env, ctx);
    },
  },
);
