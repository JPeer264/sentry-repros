import mysql from 'mysql';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'app',
  connectionLimit: 2,
});

export function query(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    pool.query(sql, (err: unknown, rows: unknown[]) => (err ? reject(err) : resolve(rows)));
  });
}
