import mysql from 'mysql';

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

export async function GET() {
  const rows = await new Promise((resolve, reject) => {
    pool.query('SELECT id, name FROM users', (err: unknown, r: unknown) => (err ? reject(err) : resolve(r)));
  });
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
}
