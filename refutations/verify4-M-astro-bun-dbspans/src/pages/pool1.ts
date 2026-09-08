import { q1 } from '../db-lib';
export const prerender = false;
export async function GET() {
  const rows = await q1();
  return new Response(JSON.stringify(rows));
}
