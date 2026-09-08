import './instrument';
import * as Sentry from '@sentry/bun';
import dc from 'node:diagnostics_channel';
import mysql from 'mysql';

const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
connection.connect();

function query(sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

Bun.serve({
  port: Number(process.env.APP_PORT),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/db') {
      const rows = await query('SELECT id, name FROM users');
      return Response.json({
        variant: 'modscope',
        rows,
        startSubscribed: dc.hasSubscribers('tracing:orchestrion:mysql:query:start'),
      });
    }
    if (url.pathname === '/sentinel') {
      Sentry.captureMessage('sentinel');
      await Sentry.flush(3000);
      return new Response('ok');
    }
    return new Response('not found', { status: 404 });
  },
});
