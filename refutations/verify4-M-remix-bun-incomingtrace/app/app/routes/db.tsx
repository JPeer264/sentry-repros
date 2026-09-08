import { json } from '@remix-run/node';
import { pool } from '../../db.mjs';

export async function loader() {
  const [rows] = await pool.query('SELECT * FROM users');
  return json({ rows });
}
export default function D() { return <div>db</div>; }
