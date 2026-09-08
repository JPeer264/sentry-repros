const mysql2 = await import('mysql2/promise');
const conn = await mysql2.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
const [rows] = await conn.query('SELECT id, name FROM users');
console.log('mysql2 rows (no sentry)', JSON.stringify(rows));
await conn.end();
