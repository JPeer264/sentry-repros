import { q2 } from '../db-lib';
export const prerender = false;
export async function GET() {
  const rows = await q2();
  return new Response(JSON.stringify(rows));
}
