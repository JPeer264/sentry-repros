const mysql = (await import('mysql2/promise')).default;
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 4,
});
globalThis.__probePool = pool;
export { pool };
