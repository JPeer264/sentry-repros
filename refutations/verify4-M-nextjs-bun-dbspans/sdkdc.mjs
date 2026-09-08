import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://public@example.invalid/1', tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`, tracesSampleRate: 1.0, traceLifecycle: 'static' });
import dc from 'node:diagnostics_channel';
const show = (tag) => {
  for (const n of ['mysql2:query', 'orchestrion:mysql2:query']) {
    const tc = dc.tracingChannel(n);
    console.log(tag, n, 'start.hasSubscribers=', tc.start?.hasSubscribers, 'agg=', tc.hasSubscribers);
  }
};
show('afterInit');
setTimeout(async () => {
  show('afterTick');
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
