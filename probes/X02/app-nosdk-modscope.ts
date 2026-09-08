import dc from 'node:diagnostics_channel';
import mysql from 'mysql';

const counts = { start: 0, end: 0, asyncStart: 0, asyncEnd: 0, error: 0 };
// Subscribed the way user code normally would: no handle on the channel is kept.
dc.tracingChannel('orchestrion:mysql:query').subscribe({
  start: () => counts.start++,
  end: () => counts.end++,
  asyncStart: () => counts.asyncStart++,
  asyncEnd: () => counts.asyncEnd++,
  error: () => counts.error++,
});

const loaded = ['mysql'];
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
        variant: 'nosdk-modscope',
        rows,
        counts,
        startSubscribed: dc.tracingChannel('orchestrion:mysql:query').start.hasSubscribers,
        rawStartSubscribed: dc.hasSubscribers('tracing:orchestrion:mysql:query:start'),
        loaded,
      });
    }
    return new Response('not found', { status: 404 });
  },
});
