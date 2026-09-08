import { json } from '@sveltejs/kit';
export const prerender = false;
export const GET = async () => {
  const res = await fetch('http://127.0.0.1:41325/rec');
  return json({ recorder: await res.json() });
};
