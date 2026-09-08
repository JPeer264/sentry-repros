import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

const client = new Redis({ host: '127.0.0.1', port: Number(process.env.REDIS_PORT || 41779), lazyConnect: false });

export async function GET() {
  await client.set('probe-key', 'probe-value');
  const value = await client.get('probe-key');
  return Response.json({ value });
}
