// Variant B: load mysql2 (static import, hoisted) BEFORE Sentry.init runs
import mysql from 'mysql2/promise';
import * as Sentry from '@sentry/node';
import * as dc from 'node:diagnostics_channel';

Sentry.init({ dsn: 'https://public@example.invalid/1', tracesSampleRate: 1.0, tunnel: process.env.SENTRY_TUNNEL });
console.log('[B] after init hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);
const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
setTimeout(async () => {
  console.log('[B] at query time hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);
  await Sentry.startSpan({ name: 'probe-root-B', op: 'test' }, async () => { const [r] = await pool.query('SELECT id, name FROM users'); console.log('[B] rows', r.length); });
  Sentry.captureMessage('sentinel-B'); await Sentry.flush(3000); await pool.end(); process.exit(0);
}, 300);
