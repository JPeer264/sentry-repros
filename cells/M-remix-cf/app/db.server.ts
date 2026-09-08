import mysql from 'mysql';

export const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

export function query(sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}
