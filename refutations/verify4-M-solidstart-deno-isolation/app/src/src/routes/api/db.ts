import mysql from 'mysql2';

const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

export async function GET() {
  const rows: unknown = await new Promise((resolve, reject) => {
    connection.query('SELECT id, name FROM users', (err: unknown, res: unknown) => (err ? reject(err) : resolve(res)));
  });
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
}
