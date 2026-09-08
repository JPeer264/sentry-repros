import '@sentry/deno/import';
import { Hono } from 'hono';
import { sentry } from '@sentry/hono/deno';
import * as Sentry from '@sentry/hono/deno';
import mysql from 'mysql';
import http from 'node:http';

const APP_PORT = Number(Deno.env.get('APP_PORT') || 52818);
const SINK_PORT = Number(Deno.env.get('SINK_PORT') || 52817);
const TUNNEL = `http://127.0.0.1:${SINK_PORT}/`;
const REC = `http://127.0.0.1:${SINK_PORT}`;
const LIFECYCLE = (Deno.env.get('LIFECYCLE') || 'stream') as 'static' | 'stream';

// MODULE scope on purpose: a driver first loaded inside a request is a known no-span case.
const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const app = new Hono();

app.use(
  '*',
  sentry(app, {
    dsn: 'https://public@example.com/1',
    tunnel: TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: LIFECYCLE,
    tracePropagationTargets: [/.*/],
  }),
);

app.get('/users/:id', c => c.json({ id: c.req.param('id') }));

app.get('/error', () => {
  throw new Error('hono deno boom');
});

app.get('/downstream', async c => {
  const r = await fetch(`${REC}/rec/downstream-fetch`);
  return c.json({ ok: r.ok });
});

app.get('/downstream-http', c => {
  return new Promise<Response>(resolve => {
    http.get(`${REC}/rec/downstream-http`, res => {
      res.resume();
      res.on('end', () => resolve(c.json({ ok: true })));
    });
  });
});

app.get('/db', async c => {
  const rows = await new Promise<unknown[]>((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, r: unknown[]) => (err ? reject(err) : resolve(r)));
  });
  return c.json({ rows: rows.length });
});

app.get('/log', c => {
  Sentry.logger.info('hello from hono deno', { route: '/log' });
  return c.json({ ok: true });
});

app.get('/tag/:t', async c => {
  const t = c.req.param('t');
  Sentry.setTag('reqtag', t);
  await new Promise(r => setTimeout(r, 60));
  Sentry.captureException(new Error(`tagged ${t}`));
  return c.json({ t });
});

app.get('/sentinel', c => {
  Sentry.captureMessage(`sentinel-${c.req.query('n') ?? '0'}`);
  return c.json({ ok: true });
});

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, app.fetch);
