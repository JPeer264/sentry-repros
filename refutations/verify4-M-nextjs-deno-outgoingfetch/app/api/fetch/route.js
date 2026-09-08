export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await fetch(`http://127.0.0.1:${process.env.RECORDER_PORT}/rec`, { cache: 'no-store' });
  const body = await res.text();
  return new Response(JSON.stringify({ ok: true, recorder: body }), {
    headers: { 'content-type': 'application/json' },
  });
}
