import './instrument';
import * as Sentry from '@sentry/bun';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 4,
});

const server = Bun.serve({
  port: Number(process.env.PORT ?? 0),
  routes: {
    '/db': async () => {
      const [rows] = await pool.query('SELECT * FROM users');
      return Response.json(rows);
    },
    '/sentinel': () => {
      Sentry.captureMessage('sentinel');
      return new Response('ok');
    },
  },
});

console.log(`PORT=${server.port}`);
