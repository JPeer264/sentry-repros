import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';
export const prerender = false;
export const GET = async ({ url }) => {
  const tag = url.searchParams.get('tag') || 'none';
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, 150));
  Sentry.captureException(new Error(`iso-${tag}`));
  return json({ tag });
};
