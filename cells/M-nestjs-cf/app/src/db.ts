import mysql from 'mysql';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
});

export function queryUsers(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
