export const prerender = false;
export async function GET() {
  const res = await fetch(`${process.env.REC}/rec`);
  const body = await res.text();
  return new Response(JSON.stringify({ ok: true, body }), { headers: { 'content-type': 'application/json' } });
}
