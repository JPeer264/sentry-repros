import { createFileRoute } from '@tanstack/react-router';
import mysql from 'mysql';

// Module scope on purpose: a driver first loaded inside a request produces no
// spans on Bun (finding K11).
const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

export const Route = createFileRoute('/api/db-mysql')({
  server: {
    handlers: {
      GET: () =>
        new Promise<Response>(resolve => {
          connection.query('SELECT id, name FROM users', (err, rows) => {
            resolve(Response.json({ err: err ? String(err) : null, rows: rows ?? null }));
          });
        }),
    },
  },
});
