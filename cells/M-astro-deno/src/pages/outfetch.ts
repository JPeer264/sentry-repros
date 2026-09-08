import type { APIRoute } from 'astro';

const sinkPort = globalThis.Deno?.env.get('SINK_PORT') ?? '47312';

export const GET: APIRoute = async () => {
  const res = await fetch(`http://127.0.0.1:${sinkPort}/rec?from=fetch`);
  return new Response(await res.text(), { headers: { 'content-type': 'application/json' } });
};
