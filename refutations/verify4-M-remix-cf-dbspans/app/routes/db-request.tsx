import { queryRequestScope } from '../db.server';

export async function loader() {
  const rows = await queryRequestScope();
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
}
