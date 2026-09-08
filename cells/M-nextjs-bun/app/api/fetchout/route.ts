export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await fetch(`${process.env.RECORDER_URL}/rec`);
  return Response.json({ status: res.status, body: await res.json() });
}
