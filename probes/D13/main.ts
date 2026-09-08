import '@sentry/deno/import';

import mysql from 'mysql';
import { Hono } from 'hono';
import * as Sentry from '@sentry/hono/deno';
import { sentry } from '@sentry/hono/deno';

const SINK_PORT = Number(Deno.env.get('SINK_PORT') ?? '41733');
const PORT = Number(Deno.env.get('PORT') ?? '41734');

// Module scope, and because of ESM hoisting this runs before `sentry()` calls init.
const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

function query(sql: string, params: unknown[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err: unknown, rows: unknown[]) => (err ? reject(err) : resolve(rows)));
  });
}

const app = new Hono();

app.use(
  '*',
  sentry(app, {
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    debug: true,
  }),
);

app.get('/users/:id', async c => {
  const rows = await query('SELECT id, name FROM users WHERE id = ?', [c.req.param('id')]);
  return c.json(rows);
});

app.get('/error', () => {
  throw new Error('route boom');
});

app.get('/sentinel', c => {
  Sentry.captureMessage('sentinel');
  return c.text('ok');
});

Deno.serve({ port: PORT }, app.fetch);
console.log(`PORT=${PORT}`);
