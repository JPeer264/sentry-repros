import { Hono } from 'hono';
import * as Sentry from '@sentry/hono/cloudflare';
import { sentry } from '@sentry/hono/cloudflare';
import mysql from 'mysql';

const SINK = 'http://127.0.0.1:41207';

const conn = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

type Env = { TRACE_LIFECYCLE?: string };

const app = new Hono<{ Bindings: Env }>();

app.use(
  sentry(app, (env: Env) => ({
    dsn: 'http://abc123@127.0.0.1:41207/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: (env.TRACE_LIFECYCLE as 'stream' | 'static') || 'stream',
  })),
);

app.get('/users/:id', c => c.json({ id: c.req.param('id') }));

app.get('/boom/:id', () => {
  throw new Error('hono-cf-boom');
});

app.get('/iso/:tag', async c => {
  const tag = c.req.param('tag');
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, 60));
  Sentry.captureException(new Error(`iso-${tag}`));
  return c.json({ tag });
});

app.get('/fetchout', async c => {
  const r = await fetch(`${SINK}/__rec?from=hono`);
  return c.json({ ok: r.ok });
});

app.get('/log', c => {
  Sentry.logger.info('hono-cf-log-line', { where: 'handler' });
  return c.json({ logged: true });
});

app.get('/db', async c => {
  const rows = await new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, res: unknown) =>
      err ? reject(err) : resolve(res),
    );
  });
  return c.json({ rows });
});

app.get('/sentinel', c => {
  Sentry.captureMessage('sentinel');
  return c.json({ sentinel: true });
});

export default app;
