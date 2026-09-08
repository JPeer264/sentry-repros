// eslint-disable-next-line
export function makeQueryConn(mysql: any) {
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    database: 'app',
  });
  connection.on('error', (e: unknown) => console.error('mysql error', e));
  connection.connect((e: unknown) => e && console.error('mysql connect error', e));
  return (sql: string) =>
    new Promise((resolve, reject) => {
      connection.query(sql, (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
    });
}
