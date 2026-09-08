import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';
// @ts-ignore no types
import mysql1 from 'mysql';

const conn = mysql1.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
conn.on('error', (e: unknown) => console.error('mysql1 err', e));
conn.connect((e: unknown) => e && console.error('mysql1 connect err', e));

const app = Sentry.withElysia(new Elysia());

app.get('/db1/:id', async () => {
  const rows = await new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
  });
  return { rows };
});

app.get('/sentinel', () => {
  Sentry.captureMessage('sentinel-preload');
  return { ok: true };
});

app.listen(Number(process.env.PORT ?? 41877));
console.log('LISTENING');
