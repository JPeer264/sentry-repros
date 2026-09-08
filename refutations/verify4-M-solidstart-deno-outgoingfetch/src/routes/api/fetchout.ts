export async function GET() {
  const url = process.env.RECORDER_URL || 'http://127.0.0.1:51422/recorder';
  const res = await fetch(url);
  return new Response(await res.text(), { headers: { 'content-type': 'application/json' } });
}
