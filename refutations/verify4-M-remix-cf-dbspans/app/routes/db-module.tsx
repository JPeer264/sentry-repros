import { queryModuleScope } from '../db.server';

export async function loader() {
  const rows = await queryModuleScope();
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
}
