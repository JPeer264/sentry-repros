import * as Sentry from '@sentry/astro';

export const prerender = false;

export const GET = async ({ url }) => {
  Sentry.captureMessage(`sentinel-${url.searchParams.get('n')}`);
  await Sentry.flush(3000);
  return new Response('sentinel');
};
