import mysql2 from 'mysql2';

export const pool2 = mysql2.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 4,
});

export function pool2Query(sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool2.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}
