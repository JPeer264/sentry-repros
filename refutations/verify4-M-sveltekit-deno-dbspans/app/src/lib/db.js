import mysql2 from 'mysql2/promise';

export const conn2 = await mysql2.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});
