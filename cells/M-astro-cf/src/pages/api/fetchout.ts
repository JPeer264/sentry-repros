export const prerender = false;

export const GET = async () => {
  const res = await fetch('http://127.0.0.1:37412/rec');
  return new Response(JSON.stringify({ ok: res.ok }), { headers: { 'content-type': 'application/json' } });
};
