import { json } from '@sveltejs/kit';
import mysql from 'mysql';

export const prerender = false;

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});
connection.on('error', () => {});

export const GET = async () => {
  const rows = await new Promise((resolve, reject) => {
    connection.query('SELECT * FROM users', (err, res) => (err ? reject(err) : resolve(res)));
  });
  return json({ rows });
};
