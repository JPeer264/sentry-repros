import { queryUsers } from '../../lib/db';

export const prerender = false;

export const GET = async () => {
  const rows = await queryUsers();
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
};
