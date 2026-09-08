export async function GET() {
  const url = process.env.RECORDER_URL || 'http://127.0.0.1:9999/__recorder';
  const res = await fetch(url);
  const body = await res.text();
  return new Response(JSON.stringify({ ok: true, body }), { headers: { 'content-type': 'application/json' } });
}
