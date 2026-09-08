import { json } from '@sveltejs/kit';
import { conn } from '$lib/db.js';

export async function GET() {
  const [rows] = await conn.query('SELECT id, name FROM users');
  return json({ driver: 'mysql2', rows: rows.length });
}
