import './instrument';
import * as Sentry from '@sentry/bun';
import dc from 'node:diagnostics_channel';
import { mysqlModulesInRequireCache } from './mysql-modules';

// Workaround under test: user code holds a strong reference to the TracingChannel the SDK subscribed
// to, so Bun's GC cannot drop the channel together with its subscribers.
(globalThis as any).__keepMysqlChannel = dc.tracingChannel('orchestrion:mysql:query');

function query(connection: any, sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

Bun.serve({
  port: Number(process.env.APP_PORT),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/db') {
      const loadedBefore = mysqlModulesInRequireCache();
      const mysql = (await import('mysql')).default;
      const loadedAfter = mysqlModulesInRequireCache();
      const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
      connection.connect();
      const rows = await query(connection, 'SELECT id, name FROM users');
      connection.end();
      return Response.json({
        variant: 'lazy-keep',
        rows,
        loadedBefore,
        loadedAfter,
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
