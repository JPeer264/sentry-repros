export async function GET() {
  const res = await fetch('http://127.0.0.1:53819/rec');
  return new Response(await res.text(), { headers: { 'content-type': 'application/json' } });
}
