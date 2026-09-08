import { tracingChannel } from 'node:diagnostics_channel';
import mysql from 'mysql2/promise';

for (const n of ['mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect']) {
  tracingChannel(n).subscribe({
    start: () => console.log('DC start', n),
    asyncStart: () => console.log('DC asyncStart', n),
    error: () => console.log('DC error', n),
  });
}

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
const [rows] = await pool.query('SELECT * FROM users');
console.log('QUERY rows', rows.length);
const [rows2] = await pool.execute('SELECT * FROM users WHERE id = ?', [1]);
console.log('EXECUTE rows', rows2.length);
await pool.end();
