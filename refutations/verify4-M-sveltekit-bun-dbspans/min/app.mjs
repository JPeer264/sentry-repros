import './instrument.mjs';
import * as Sentry from '@sentry/node';
import dc from 'node:diagnostics_channel';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

console.log('[probe] mysql2:query start.hasSubscribers =', dc.tracingChannel('mysql2:query').start.hasSubscribers);

await Sentry.startSpan({ name: 'probe-root', op: 'test' }, async () => {
  const [rows] = await pool.query('SELECT * FROM users');
  console.log('[probe] rows', rows.length);
});
Sentry.captureMessage('sentinel');
await Sentry.flush(3000);
await pool.end();
