import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://public@example.invalid/1', tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`, tracesSampleRate: 1.0, traceLifecycle: 'static' });
import dc from 'node:diagnostics_channel';
globalThis.__keep = ['mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect'].map(n => dc.tracingChannel(n));
console.log('afterInit start.hasSubscribers=', dc.tracingChannel('mysql2:query').start?.hasSubscribers);
setTimeout(async () => {
  Bun.gc(true);
  console.log('afterGC start.hasSubscribers=', dc.tracingChannel('mysql2:query').start?.hasSubscribers);
  const mysql = (await import('mysql2/promise')).default;
  const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
  await Sentry.startSpan({ name: 'probe-root', op: 'test' }, async () => {
    const [rows] = await pool.query('SELECT id,name FROM users');
    console.log('rows', rows.length);
  });
  await pool.end();
  Sentry.captureMessage('sentinel');
  await Sentry.flush(3000);
}, 50);
