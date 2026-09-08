export async function GET({ fetch }) {
  const r = await fetch(`http://127.0.0.1:${process.env.REC_PORT}/rec-eventfetch`);
  return new Response(await r.text());
}
