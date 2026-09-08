import * as Sentry from '@sentry/cloudflare';

export const prerender = false;

export const GET = async () => {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(3000);
  return new Response('sentinel');
};
