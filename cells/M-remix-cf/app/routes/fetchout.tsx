export async function loader() {
  const res = await fetch('http://127.0.0.1:45732/rec');
  return new Response(JSON.stringify({ ok: res.status }), {
    headers: { 'content-type': 'application/json' },
  });
}
