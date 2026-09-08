export const prerender = false;

export async function GET() {
  const res = await fetch(`http://127.0.0.1:${process.env.REC_PORT}/rec`);
  const body = await res.text();
  return new Response(JSON.stringify({ ok: true, body }), { headers: { 'content-type': 'application/json' } });
}
