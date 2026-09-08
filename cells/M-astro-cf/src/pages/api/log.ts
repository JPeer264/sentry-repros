import * as Sentry from '@sentry/cloudflare';

export const prerender = false;

export const GET = () => {
  Sentry.logger.info('hello from astro on cloudflare', { route: '/api/log' });
  return new Response('logged');
};
