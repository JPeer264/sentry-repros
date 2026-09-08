export async function GET() {
  const res = await fetch('http://127.0.0.1:47312/recorder');
  return new Response(await res.text(), { headers: { 'content-type': 'application/json' } });
}
