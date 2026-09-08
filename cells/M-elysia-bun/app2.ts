import './instrument';
import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';
import mysqlLegacy from 'mysql';

const APP_PORT = Number(process.env.APP_PORT ?? 41374);

const connection = mysqlLegacy.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

Sentry.withElysia(new Elysia())
  .get('/db2', async () => {
    const rows = await new Promise((resolve, reject) => {
      connection.query('SELECT id, name FROM users', (err: unknown, res: unknown) => (err ? reject(err) : resolve(res)));
    });
    return rows as object;
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return { ok: true };
  })
  .listen(APP_PORT);

console.log(`app2 listening ${APP_PORT} lifecycle=${process.env.LIFECYCLE ?? 'stream'}`);
