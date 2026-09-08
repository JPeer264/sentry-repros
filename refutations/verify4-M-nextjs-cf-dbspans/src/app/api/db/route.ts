// @ts-ignore -- `mysql` ships no types
import mysql from 'mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connection = (mysql as any).createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    database: 'app',
  });
  connection.on('error', () => {});

  const rows = await new Promise<unknown>((resolve, reject) => {
    connection.query('SELECT id, name FROM users', (err: unknown, res: unknown) => {
      connection.end();
      if (err) return reject(err);
      resolve(res);
    });
  });

  return Response.json({ driver: 'mysql', rows });
}
