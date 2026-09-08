import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';

const pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

export async function GET() {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return Response.json({ rows });
}
