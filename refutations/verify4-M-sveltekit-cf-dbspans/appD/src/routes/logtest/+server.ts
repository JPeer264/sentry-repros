import { json } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';
export const prerender = false;
export const GET = async () => {
  Sentry.logger.info('hello from sveltekit cloudflare route');
  return json({ ok: true });
};
