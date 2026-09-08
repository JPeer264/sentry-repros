// Variant D: side-effect-only import of the driver placed AFTER the Sentry import
import * as Sentry from '@sentry/node';
import 'mysql2/promise';
import * as dc from 'node:diagnostics_channel';
Sentry.init({ dsn: 'https://public@example.invalid/1', tracesSampleRate: 1.0, tunnel: process.env.SENTRY_TUNNEL });
const mysql = (await import('mysql2/promise')).default;
const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
setTimeout(async () => {
  console.log('[D] at query time hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);
  await Sentry.startSpan({ name: 'probe-root-D', op: 'test' }, async () => { await pool.query('SELECT id FROM users'); });
  await Sentry.flush(2000); await pool.end(); process.exit(0);
}, 300);
