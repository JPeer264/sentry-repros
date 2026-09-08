export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const rec = new URL(req.url).searchParams.get('rec')!;
  const res = await fetch(`${rec}?via=fetch`);
  return Response.json({ status: res.status, body: await res.json() });
}
