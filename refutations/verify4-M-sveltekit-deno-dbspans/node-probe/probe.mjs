import { createRequire } from 'node:module';

const DRIVER = process.env.DRIVER || 'mysql2';
const PREWARM = process.env.PREWARM === '1';

if (PREWARM) {
  const require = createRequire(import.meta.url);
  // Deno bug denoland/deno#36240: once Module.registerHooks() is active, require('*.json')
  // is compiled as JS. Loading mysql2's package.json into the CJS cache first sidesteps it.
  require('mysql2/package.json');
  console.log('prewarmed mysql2/package.json');
}

const Sentry = await import('@sentry/node');
Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: 'http://127.0.0.1:41777/',
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  debug: true,
});

let run;
try {
  if (DRIVER === 'mysql2') {
    const mysql = (await import('mysql2/promise')).default;
    const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
    run = async () => { const [rows] = await conn.query('SELECT id, name FROM users'); return rows.length; };
  } else {
    const mysql = (await import('mysql')).default;
    const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
    await new Promise((res, rej) => conn.connect(e => (e ? rej(e) : res())));
    run = () => new Promise((res, rej) => conn.query('SELECT id, name FROM users', (e, rows) => (e ? rej(e) : res(rows.length))));
  }
} catch (e) {
  console.log('DRIVER LOAD FAIL:', e.constructor.name, e.message);
  process.exit(1);
}

await Sentry.startSpan({ name: 'probe-parent', op: 'probe' }, async () => {
  const n = await run();
  console.log('rows:', n);
});
Sentry.captureMessage('sentinel');
await Sentry.flush(4000);
process.exit(0);
