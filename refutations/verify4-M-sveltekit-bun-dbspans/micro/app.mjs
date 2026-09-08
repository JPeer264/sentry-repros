import * as Sentry from '@sentry/node';
import * as dc from 'node:diagnostics_channel';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tracesSampleRate: 1.0,
  tunnel: process.env.SENTRY_TUNNEL,
  traceLifecycle: process.env.LIFECYCLE || 'stream',
  debug: process.env.DBG === '1',
});

console.log('[probe] after init, mysql2:query hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);

const mysqlMod = await import('mysql2/promise');
const pool = mysqlMod.default.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

setTimeout(async () => {
  console.log('[probe] at query time, mysql2:query hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);
  await Sentry.startSpan({ name: 'probe-root', op: 'test' }, async () => {
    const [rows] = await pool.query('SELECT id, name FROM users');
    console.log('[probe] rows', rows.length);
  });
  Sentry.captureMessage('sentinel');
  await Sentry.flush(3000);
  await pool.end();
  process.exit(0);
}, 300);
