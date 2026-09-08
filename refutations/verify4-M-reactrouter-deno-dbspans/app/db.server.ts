import mysql from 'mysql';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 4,
});

export function poolQuery(sql: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

// Opening the pool's first TCP connection at boot is one of the variants under test.
export const warmed: Promise<unknown> =
  process.env.RR_WARM === '1' ? poolQuery('SELECT 1 AS warm').catch(() => null) : Promise.resolve(null);
