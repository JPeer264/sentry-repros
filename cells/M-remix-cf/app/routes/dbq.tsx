import { query } from '../db.server';

export async function loader() {
  const rows = await query('SELECT id, name FROM users');
  return new Response(JSON.stringify({ rows }), {
    headers: { 'content-type': 'application/json' },
  });
}
