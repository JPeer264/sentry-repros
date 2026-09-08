import { json } from '@sveltejs/kit';
import mysql from 'mysql';

export const GET = async () => {
  const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
  try {
    const n = await new Promise((resolve, reject) => {
      connection.query('SELECT id, name FROM users', (err, rows) => (err ? reject(err) : resolve(rows.length)));
    });
    return json({ driver: 'mysql', rows: n });
  } finally {
    connection.end(() => {});
  }
};
