import './instrument';
import * as Sentry from '@sentry/bun';
import mysql from 'mysql2/promise';

const server = Bun.serve({
  port: Number(process.env.PORT ?? 0),
  routes: {
    '/db': async () => {
      const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        database: 'app',
      });
      const [rows] = await conn.query('SELECT * FROM users');
      await conn.end();
      return Response.json(rows);
    },
    '/sentinel': () => {
      Sentry.captureMessage('sentinel');
      return new Response('ok');
    },
  },
});

console.log(`PORT=${server.port}`);
