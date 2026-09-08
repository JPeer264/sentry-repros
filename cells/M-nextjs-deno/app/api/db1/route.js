import mysql from 'mysql';

const connection = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await new Promise((resolve, reject) => {
    connection.query('SELECT id, name FROM users', (err, result) => (err ? reject(err) : resolve(result)));
  });
  return Response.json({ rows });
}
