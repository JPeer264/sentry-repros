import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  throw new Error('astro-deno-route-error');
};
