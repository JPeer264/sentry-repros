export const prerender = false;
export async function GET() {
  const r = await fetch(`http://127.0.0.1:${process.env.REC_PORT}/rec?via=fetch`);
  return new Response(JSON.stringify({ via: 'fetch', body: await r.text() }), { headers: { 'content-type': 'application/json' } });
}
