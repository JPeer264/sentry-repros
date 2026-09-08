import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dc = require('node:diagnostics_channel');
const cache = new Map();
const orig = dc.tracingChannel;
dc.tracingChannel = function (name) {
  if (typeof name !== 'string') return orig.call(this, name);
  let c = cache.get(name);
  if (!c) { c = orig.call(this, name); cache.set(name, c); }
  return c;
};
const bm = process.getBuiltinModule('node:diagnostics_channel');
console.log('patch visible via getBuiltinModule?', bm.tracingChannel !== orig);

const tc = dc.tracingChannel('mysql2:query');
tc.subscribe({ start: () => console.log('EVT start'), asyncStart: () => console.log('EVT asyncStart'), asyncEnd: () => console.log('EVT asyncEnd'), end: () => console.log('EVT end'), error: (e) => console.log('EVT error', e) });

const mysql = (await import('mysql2/promise')).default;
const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
const [rows] = await pool.query('SELECT id,name FROM users');
console.log('rows', rows.length);
await pool.end();
