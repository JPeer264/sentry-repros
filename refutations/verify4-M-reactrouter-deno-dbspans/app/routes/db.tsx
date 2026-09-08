import * as Sentry from '@sentry/react-router';
import mysql from 'mysql';
import { pool, poolQuery, warmed } from '../db.server';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'pool';

  if (mode === 'fresh') {
    const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
    const rows = await new Promise((resolve, reject) => {
      conn.query('SELECT id FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
    });
    conn.end();
    return { mode, rows };
  }

  if (mode === 'bind') {
    const parent = Sentry.getActiveSpan();
    const rows = await new Promise((resolve, reject) => {
      pool.getConnection((err: unknown, conn: any) => {
        if (err) return reject(err);
        Sentry.withActiveSpan(parent ?? null, () => {
          conn.query('SELECT id FROM users', (e: unknown, r: unknown) => {
            conn.release();
            e ? reject(e) : resolve(r);
          });
        });
      });
    });
    return { mode, rows };
  }

  if (mode === 'getconn') {
    const rows = await new Promise((resolve, reject) => {
      pool.getConnection((err: unknown, conn: any) => {
        if (err) return reject(err);
        conn.query('SELECT id FROM users', (e: unknown, r: unknown) => {
          conn.release();
          e ? reject(e) : resolve(r);
        });
      });
    });
    return { mode, rows };
  }

  if (mode === 'warm') {
    await warmed;
  }

  const rows = await poolQuery('SELECT id, name FROM users');
  return { mode, rows };
}

export default function Db() { return <p>db</p>; }
