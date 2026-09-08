import mysql from 'mysql';

const config = { host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'app' };

export const pool = mysql.createPool(config);

export function queryPool(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    pool.query(sql, (err: unknown, rows: unknown[]) => (err ? reject(err) : resolve(rows)));
  });
}

export function queryFresh(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const conn = mysql.createConnection(config);
    conn.query(sql, (err: unknown, rows: unknown[]) => {
      conn.end();
      return err ? reject(err) : resolve(rows);
    });
  });
}
