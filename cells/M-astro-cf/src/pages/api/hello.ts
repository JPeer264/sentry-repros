export const prerender = false;

export const GET = () =>
  new Response(JSON.stringify({ hello: 'world' }), { headers: { 'content-type': 'application/json' } });
