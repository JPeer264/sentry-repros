import mysql from 'mysql2/promise';
import * as Sentry from '@sentry/deno';

const APP_PORT = Number(Deno.env.get('APP_PORT'));

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 5,
});

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1' }, async (request: Request) => {
  const url = new URL(request.url);

  if (url.pathname === '/users') {
    const [rows] = await pool.query('SELECT * FROM users');
    return new Response(JSON.stringify(rows) + '\n', { status: 200 });
  }

  if (url.pathname === '/users-conn') {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      database: 'app',
    });
    const [rows] = await conn.query('SELECT * FROM users');
    await conn.end();
    return new Response(JSON.stringify(rows) + '\n', { status: 200 });
  }

  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel\n', { status: 200 });
  }

  return new Response('not found\n', { status: 404 });
});

console.log(`app listening ${APP_PORT}`);
