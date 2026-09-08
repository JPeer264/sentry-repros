import { tracingChannel } from 'node:diagnostics_channel';
import mysql from 'mysql2/promise';

for (const n of ['orchestrion:mysql2:query', 'orchestrion:mysql2:execute']) {
  tracingChannel(n).subscribe({
    start: () => console.log('DC start', n),
    end: () => console.log('DC end', n),
    asyncStart: () => console.log('DC asyncStart', n),
    asyncEnd: () => console.log('DC asyncEnd', n),
    error: () => console.log('DC error', n),
  });
}

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
const [rows] = await pool.query('SELECT * FROM users');
console.log('QUERY rows', rows.length);
const [rows2] = await pool.execute('SELECT * FROM users WHERE id = ?', [1]);
console.log('EXECUTE rows', rows2.length);
await pool.end();
