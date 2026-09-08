import mysql from 'mysql';
import mysql2 from 'mysql2';

const base = { host: '127.0.0.1', port: 3307, user: 'root', database: 'app' };

export const pool = mysql.createPool({ ...base, connectionLimit: 2 });

export const pool2NoEval = mysql2.createPool({ ...base, connectionLimit: 2, disableEval: true } as any);
export const pool2Eval = mysql2.createPool({ ...base, connectionLimit: 2 });

export function queryUsers(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

export function queryPool2(noEval: boolean): Promise<unknown> {
  const p = noEval ? pool2NoEval : pool2Eval;
  return new Promise((resolve, reject) => {
    p.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => (err ? reject(err) : resolve(rows)));
  });
}

export function queryFresh2(noEval: boolean): Promise<unknown> {
  const conn = mysql2.createConnection({ ...base, ...(noEval ? { disableEval: true } : {}) } as any);
  return new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
      conn.end(() => {});
      err ? reject(err) : resolve(rows);
    });
  });
}

export function execFresh2(): Promise<unknown> {
  const conn = mysql2.createConnection({ ...base, disableEval: true } as any);
  return new Promise((resolve, reject) => {
    conn.execute('SELECT id, name FROM users WHERE id > ?', [0], (err: unknown, rows: unknown) => {
      conn.end(() => {});
      err ? reject(err) : resolve(rows);
    });
  });
}

export function queryFresh1(): Promise<unknown> {
  const conn = mysql.createConnection(base);
  return new Promise((resolve, reject) => {
    conn.query('SELECT id, name FROM users', (err: unknown, rows: unknown) => {
      conn.end(() => {});
      err ? reject(err) : resolve(rows);
    });
  });
}
