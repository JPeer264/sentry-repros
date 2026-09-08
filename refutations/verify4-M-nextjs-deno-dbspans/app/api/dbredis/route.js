import { redis } from '../../../lib.js';
export const dynamic = 'force-dynamic';
export async function GET() {
  await redis.set('probe:key', 'v1');
  const value = await redis.get('probe:key');
  return Response.json({ value });
}
