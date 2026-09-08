import { pool } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows] = await pool.query('SELECT id, name FROM users');
  return Response.json({ rows });
}
