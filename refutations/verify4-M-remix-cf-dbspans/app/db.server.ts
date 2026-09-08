// @ts-ignore -- mysql ships no types
import mysql from 'mysql';

const CFG = { host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'app' };

// Module-scope connection: workerd forbids I/O in global scope, but mysql
// opens its socket lazily on the first query.
const moduleConn = (mysql as any).createConnection(CFG);
moduleConn.on('error', () => {});

export function queryModuleScope(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    moduleConn.query('SELECT id, name FROM users', (err: unknown, rows: unknown) =>
      err ? reject(err) : resolve(rows),
    );
  });
}

export function queryRequestScope(): Promise<unknown> {
  const conn = (mysql as any).createConnection(CFG);
  conn.on('error', () => {});
  return new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
      conn.end();
      return err ? reject(err) : resolve(rows);
    });
  });
}
