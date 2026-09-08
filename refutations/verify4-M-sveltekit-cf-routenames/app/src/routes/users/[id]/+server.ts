import { json } from '@sveltejs/kit';
export const prerender = false;
export const GET = async ({ params }) => {
  await new Promise(r => setTimeout(r, 5));
  return json({ id: params.id });
};
