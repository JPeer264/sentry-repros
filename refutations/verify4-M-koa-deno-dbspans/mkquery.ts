// eslint-disable-next-line
export function makeQuery(mysql: any) {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    database: 'app',
    connectionLimit: 2,
  });
  return (sql: string) =>
    new Promise((resolve, reject) => {
      pool.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
    });
}
