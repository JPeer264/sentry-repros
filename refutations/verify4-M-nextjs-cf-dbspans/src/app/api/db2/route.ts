import mysql2 from 'mysql2/promise';

export const dynamic = 'force-dynamic';

// `disableEval: true` makes mysql2 use its static row parsers instead of
// building them with `new Function`, which workerd rejects.
const pool = mysql2.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
  connectionLimit: 2,
  disableEval: true,
});

export async function GET() {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return Response.json({ driver: 'mysql2', rows });
}
