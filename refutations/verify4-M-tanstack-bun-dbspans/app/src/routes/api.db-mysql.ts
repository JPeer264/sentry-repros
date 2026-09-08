import { createFileRoute } from '@tanstack/react-router';
import mysql from 'mysql';

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'app',
});

export const Route = createFileRoute('/api/db-mysql')({
  server: {
    handlers: {
      GET: () => {
        return new Promise<Response>(resolve => {
          connection.query('SELECT 1 + 1 AS solution', (err: unknown, rows: unknown) => {
            connection.query('SELECT name FROM users', (err2: unknown, rows2: unknown) => {
              resolve(Response.json({ status: 'ok', err: String(err), rows, err2: String(err2), rows2 }));
            });
          });
        });
      },
    },
  },
});
