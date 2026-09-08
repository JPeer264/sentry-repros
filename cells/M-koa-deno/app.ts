import * as Sentry from '@sentry/deno';
import Koa from 'koa';
import Router from '@koa/router';
import mysql from 'mysql';
import http from 'node:http';

const PORT = Number(Deno.env.get('APP_PORT'));
const REC_PORT = Number(Deno.env.get('RECORDER_PORT'));

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

const app = new Koa();
const router = new Router();

router.get('/users/:id', ctx => {
  ctx.body = { id: ctx.params.id };
});

router.get('/boom', () => {
  throw new Error('koa boom');
});

router.get('/db', async ctx => {
  const rows: any = await new Promise((res, rej) =>
    pool.query('SELECT id, name FROM users', (e: any, r: any) => (e ? rej(e) : res(r))),
  );
  ctx.body = { rows: rows.length };
});

router.get('/downstream', async ctx => {
  const r = await fetch(`http://127.0.0.1:${REC_PORT}/api/fetch`);
  ctx.body = await r.text();
});

router.get('/downstream-http', async ctx => {
  ctx.body = await new Promise<string>((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${REC_PORT}/api/node-http`, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
  });
});

router.get('/log', ctx => {
  Sentry.logger.info('koa deno log', { route: '/log' });
  ctx.body = 'logged';
});

router.get('/iso/:tag', async ctx => {
  const tag = String(ctx.params.tag);
  Sentry.setTag('req_tag', tag);
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  Sentry.captureException(new Error(`iso ${tag}`));
  ctx.body = tag;
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.body = 's';
});

app.use(router.routes());
app.use(router.allowedMethods());

if (Deno.env.get('ERR_HANDLER') === '1') {
  app.on('error', err => {
    Sentry.captureException(err, { mechanism: { type: 'manual.koa.onerror', handled: false } });
  });
}

app.listen(PORT, '127.0.0.1', () => console.log(`APP_READY ${PORT}`));
