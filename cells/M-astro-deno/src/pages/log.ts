import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';

export const GET: APIRoute = () => {
  Sentry.logger.info('astro-deno-log-line', { where: 'route' });
  return new Response('logged');
};
