import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';

export const GET: APIRoute = async ({ url }) => {
  Sentry.captureMessage(`sentinel-${url.searchParams.get('n') ?? '0'}`);
  await Sentry.flush(2000);
  return new Response('ok');
};
