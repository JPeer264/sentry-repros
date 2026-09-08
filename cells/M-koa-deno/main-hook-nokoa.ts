import '@sentry/deno/import';
import './instrument.ts';
import * as Sentry from '@sentry/deno';
import mysql from 'mysql';
import http from 'node:http';

const PORT = Number(Deno.env.get('APP_PORT'));
const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

http
  .createServer(async (req, res) => {
    if (req.url === '/db') {
      const rows: any = await new Promise((resolve, reject) =>
        pool.query('SELECT id, name FROM users', (e: any, r: any) => (e ? reject(e) : resolve(r))),
      );
      res.end(JSON.stringify({ rows: rows.length }));
      return;
    }
    if (req.url === '/sentinel') {
      Sentry.captureMessage('sentinel');
      res.end('s');
      return;
    }
    res.end('ok');
  })
  .listen(PORT, '127.0.0.1', () => console.log(`APP_READY ${PORT}`));
