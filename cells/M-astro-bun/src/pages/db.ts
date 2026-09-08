import { pool } from '../lib/db';

export const prerender = false;

export const GET = async () => {
  const [rows] = await pool.query('SELECT id, name FROM users WHERE id > 0');
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
};
