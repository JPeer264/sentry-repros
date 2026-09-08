import mysql2 from 'mysql2';
import mysql from 'mysql';

export const pool2 = mysql2.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });
export const pool1 = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

export function q2(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool2.query('SELECT id, name FROM users WHERE id > 0', (err: unknown, res: unknown) => (err ? reject(err) : resolve(res)));
  });
}
export function q1(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool1.query('SELECT id, name FROM users WHERE id > 1', (err: unknown, res: unknown) => (err ? reject(err) : resolve(res)));
  });
}
