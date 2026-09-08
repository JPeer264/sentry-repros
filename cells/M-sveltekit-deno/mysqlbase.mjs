// Control: mysql2 on Deno with no Sentry in the process.
import mysql2 from 'mysql2/promise';

const conn = await mysql2.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
const [rows] = await conn.query('SELECT id, name FROM users');
console.log('mysqlbase rows:', rows.length);
await conn.end();
