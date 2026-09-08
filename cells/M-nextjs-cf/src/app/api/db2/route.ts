import mysql from 'mysql';

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await new Promise((resolve, reject) => {
    pool.query('SELECT id, name FROM users', (err: unknown, result: unknown) =>
      err ? reject(err) : resolve(result),
    );
  });
  return Response.json({ rows });
}
