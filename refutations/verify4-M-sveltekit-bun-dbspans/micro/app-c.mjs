// Variant C: user keeps a strong reference to the mysql2 channels before init
import * as dc from 'node:diagnostics_channel';
globalThis.__sentryKeepChannels = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(n => dc.tracingChannel(n));
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: 'https://public@example.invalid/1', tracesSampleRate: 1.0, tunnel: process.env.SENTRY_TUNNEL });
console.log('[C] after init hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);
const mysql = (await import('mysql2/promise')).default;
const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
setTimeout(async () => {
  console.log('[C] at query time hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers, 'keep:', globalThis.__sentryKeepChannels.length);
  await Sentry.startSpan({ name: 'probe-root-C', op: 'test' }, async () => { const [r] = await pool.query('SELECT id, name FROM users'); console.log('[C] rows', r.length); });
  Sentry.captureMessage('sentinel-C'); await Sentry.flush(3000); await pool.end(); process.exit(0);
}, 300);
