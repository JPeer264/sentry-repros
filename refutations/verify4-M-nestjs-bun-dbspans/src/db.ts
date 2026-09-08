// eslint-disable-next-line
const mysql = require('mysql');

export const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'app',
});

connection.on('error', (err: unknown) => console.error('mysql connection error', err));
connection.connect((err: unknown) => {
  if (err) console.error('mysql connect error', err);
});

export function queryUsers(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    connection.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
