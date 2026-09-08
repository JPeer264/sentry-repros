import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';
import mysql2 from 'mysql2/promise';
import mysql from 'mysql';

async function runQuery2() {
  const conn = await mysql2.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    database: 'app',
    disableEval: true,
  });
  const [rows] = await conn.query('SELECT id, name FROM users');
  await conn.end();
  return rows;
}

let legacyConn;
function runQuery1() {
  if (!legacyConn) {
    legacyConn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
  }
  return new Promise((resolve, reject) => {
    legacyConn.query('SELECT id, name FROM users', (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function buildApp() {
  const app = new Koa();
  const router = new Router();

  router.get('/db', async ctx => {
    try {
      ctx.body = { rows: await runQuery2() };
    } catch (e) {
      ctx.status = 500;
      ctx.body = { dbError: String((e && e.stack) || e) };
    }
  });

  router.get('/db1', async ctx => {
    try {
      ctx.body = { rows: await runQuery1() };
    } catch (e) {
      ctx.status = 500;
      ctx.body = { dbError: String((e && e.stack) || e) };
    }
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
  return app;
}

let listening;
function ensureApp() {
  if (!listening) {
    const app = buildApp();
    listening = new Promise(resolve => app.listen(8080, resolve));
  }
  return listening;
}

const inner = httpServerHandler({ port: 8080 });

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:52907/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    sendDefaultPii: true,
  }),
  {
    async fetch(request, env, ctx) {
      if (new URL(request.url).pathname === '/nodb-db') {
        try {
          return Response.json({ rows: await runQuery2() });
        } catch (e) {
          return Response.json({ dbError: String((e && e.stack) || e) }, { status: 500 });
        }
      }
      await ensureApp();
      return inner.fetch(request, env, ctx);
    },
  },
);
