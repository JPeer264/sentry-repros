export const prerender = false;

export const GET = ({ params }) => new Response(JSON.stringify({ id: params.id }), {
  headers: { 'content-type': 'application/json' },
});
