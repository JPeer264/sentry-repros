import mysql from 'mysql2/promise';

// workerd forbids `new Function`; mysql2 needs disableEval to build row parsers without it.
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
  disableEval: true,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return Response.json({ rows });
}
