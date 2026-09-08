import * as Sentry from '@sentry/elysia';

Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tunnel: process.env.TUNNEL ?? 'http://127.0.0.1:41872/',
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as 'stream' | 'static') ?? 'stream',
  debug: !!process.env.DEBUG,
  environment: 'qa',
});

import { Elysia } from 'elysia';
import mysql2 from 'mysql2/promise';
// @ts-ignore no types
import mysql1 from 'mysql';

const pool = mysql2.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const conn = mysql1.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
conn.on('error', (e: unknown) => console.error('mysql1 err', e));
conn.connect((e: unknown) => e && console.error('mysql1 connect err', e));

const app = Sentry.withElysia(new Elysia());

app.get('/db2/:id', async () => {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return { rows };
});

app.get('/db1/:id', async () => {
  const rows = await new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
  });
  return { rows };
});

app.get('/sentinel', () => {
  Sentry.captureMessage('sentinel');
  return { ok: true };
});

app.listen(Number(process.env.PORT ?? 41871));
console.log('LISTENING', process.env.PORT ?? 41871);
