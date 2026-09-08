export const dynamic = 'force-dynamic';

export async function GET() {
  const target = process.env.PROBE_RECORDER as string;
  const res = await fetch(target, { cache: 'no-store' });
  const body = await res.json();
  return Response.json(body);
}
