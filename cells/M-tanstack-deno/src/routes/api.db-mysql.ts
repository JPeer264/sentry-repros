import { createFileRoute } from '@tanstack/react-router';
import mysql from 'mysql';

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

export const Route = createFileRoute('/api/db-mysql')({
  server: {
    handlers: {
      GET: () => {
        return new Promise<Response>(resolve => {
          connection.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
            resolve(Response.json({ status: err ? 'error' : 'ok', rows: err ? String(err) : rows }));
          });
        });
      },
    },
  },
});
