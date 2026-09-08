import './instrument';
import * as Sentry from '@sentry/bun';
import Koa from 'koa';
import Router from '@koa/router';
import mysql from 'mysql';

const PORT = Number(process.env.APP_PORT);
const REC_PORT = Number(process.env.REC_PORT);

// module-scope connection (K11: a driver first loaded inside a request gets no spans on Bun)
const db = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const app = new Koa();
const router = new Router();

router.get('/users/:id', ctx => {
  ctx.body = { id: ctx.params.id };
});

router.get('/iso', async ctx => {
  const tag = String(ctx.query.tag);
  Sentry.setTag('probe', tag);
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  Sentry.captureException(new Error(`iso ${tag}`));
  ctx.body = tag;
});

router.get('/boom', () => {
  throw new Error('koa boom');
});

router.get('/fetch', async ctx => {
  const r = await fetch(`http://127.0.0.1:${REC_PORT}/downstream`);
  ctx.body = await r.text();
});

router.get('/db', async ctx => {
  const rows: any = await new Promise((res, rej) =>
    db.query('SELECT id, name FROM users', (e: any, r: any) => (e ? rej(e) : res(r))),
  );
  ctx.body = { rows: rows.length };
});

router.get('/log', ctx => {
  Sentry.logger.info('hello from koa on bun', { route: '/log' });
  ctx.body = 'logged';
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.body = 's';
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, '127.0.0.1', () => console.log(`APP_READY ${PORT}`));
