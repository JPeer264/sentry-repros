import Hapi from '@hapi/hapi';
import mysql from 'mysql';
import mysql2 from 'mysql2/promise';

// Module-scope pool: mysql opens its socket lazily on the first query, so this
// does no I/O at isolate startup.
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'app',
  connectionLimit: 2,
});

export const server = Hapi.server({ port: 8080, host: '0.0.0.0' });

export function registerRoutes(Sentry) {
  server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });
  server.route({
    method: 'GET',
    path: '/db/{id}',
    handler: async req => {
      const rows = await new Promise((resolve, reject) => {
        pool.query('SELECT id, name FROM users', (err, res) => (err ? reject(err) : resolve(res)));
      });
      return { id: req.params.id, rows: rows.length };
    },
  });
  server.route({
    method: 'GET',
    path: '/db-inline/{id}',
    handler: async req => {
      const conn = mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '',
        database: 'app',
      });
      conn.on('error', () => {});
      const rows = await new Promise((resolve, reject) => {
        conn.query('SELECT name FROM users', (err, res) => {
          conn.end();
          return err ? reject(err) : resolve(res);
        });
      });
      return { id: req.params.id, rows: rows.length };
    },
  });
  server.route({
    method: 'GET',
    path: '/db2/{id}',
    handler: async req => {
      try {
      const conn = await mysql2.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '',
        database: 'app',
      });
      const [rows] = await conn.query('SELECT id FROM users');
      await conn.end();
      return { id: req.params.id, rows: rows.length };
      } catch (e) {
        return { err: String(e && e.message || e) };
      }
    },
  });
  server.route({
    method: 'GET',
    path: '/sentinel',
    handler: () => {
      Sentry.captureMessage('sentinel');
      return { sentinel: true };
    },
  });
}
