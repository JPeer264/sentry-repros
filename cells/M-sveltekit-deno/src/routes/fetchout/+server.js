export async function GET() {
  const r = await fetch(`http://127.0.0.1:${process.env.REC_PORT}/rec-fetch`);
  return new Response(await r.text());
}
