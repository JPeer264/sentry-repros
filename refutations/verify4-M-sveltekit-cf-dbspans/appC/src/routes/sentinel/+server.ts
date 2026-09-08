import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';
export const prerender = false;
export const GET = async ({ url }) => {
  Sentry.captureMessage(`sentinel-${url.searchParams.get('n') || '0'}`);
  return json({ ok: true });
};
