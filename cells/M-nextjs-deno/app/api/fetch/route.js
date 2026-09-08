export const dynamic = 'force-dynamic';

export async function GET(req) {
  const target = new URL(req.url).searchParams.get('target');
  const res = await fetch(target);
  return Response.json({ status: res.status, body: await res.json() });
}
