import { Hono } from 'hono';
import * as Sentry from '@sentry/hono/bun';
import { sentry } from '@sentry/hono/bun';
import mysql2 from 'mysql2';
import mysqlLegacy from 'mysql';

const SINK = process.env.SINK_PORT || '41733';
const REC = process.env.REC_PORT || '41802';

// Module scope on purpose: a driver whose module first loads inside a request gets no spans on Bun.
const conn2 = mysql2.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
const connOld = mysqlLegacy.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const app = new Hono();

app.use(
  sentry(app, {
    dsn: 'http://public@127.0.0.1:1/1',
    tunnel: `http://127.0.0.1:${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.LIFECYCLE as 'static' | 'stream') || 'static',
  }),
);

app.get('/users/:id', c => c.json({ id: c.req.param('id') }));

app.get('/boom', () => {
  throw new Error('hono-bun-route-error');
});

app.get('/iso/:tag', async c => {
  const tag = c.req.param('tag');
  Sentry.setTag('req-tag', tag);
  await new Promise(r => setTimeout(r, 150 + Math.floor(Math.random() * 100)));
  Sentry.captureException(new Error(`iso-${tag}`));
  return c.json({ tag });
});

app.get('/fetchout', async c => {
  const res = await fetch(`http://127.0.0.1:${REC}/rec`);
  return c.json({ ok: res.ok });
});

app.get('/db', async c => {
  const rows = await new Promise((resolve, reject) => {
    conn2.query('SELECT * FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
  });
  return c.json({ rows });
});

app.get('/dbold', async c => {
  const rows = await new Promise((resolve, reject) => {
    connOld.query('SELECT * FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
  });
  return c.json({ rows });
});

app.get('/log', c => {
  Sentry.logger.info('hono-bun-log-line', { where: 'handler' });
  return c.json({ logged: true });
});

app.get('/sentinel', c => {
  Sentry.captureMessage('sentinel');
  return c.json({ sentinel: true });
});

export default { port: Number(process.env.PORT || 41800), fetch: app.fetch };
