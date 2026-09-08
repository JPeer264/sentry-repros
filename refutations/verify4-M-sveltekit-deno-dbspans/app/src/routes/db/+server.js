import { json } from '@sveltejs/kit';
import { conn2 } from '$lib/db.js';

export const GET = async () => {
  const [rows] = await conn2.query('SELECT id, name FROM users');
  return json({ driver: 'mysql2', rows: rows.length });
};
