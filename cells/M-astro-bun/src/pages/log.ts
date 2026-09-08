import * as Sentry from '@sentry/astro';

export const prerender = false;

export const GET = () => {
  Sentry.logger.info('astro-bun-log-from-handler', { where: 'route' });
  return new Response('logged');
};
