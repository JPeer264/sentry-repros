import * as Sentry from '@sentry/astro';

export const prerender = false;

export async function GET() {
  Sentry.captureMessage('probe-sentinel');
  await Sentry.flush(2000);
  return new Response('sentinel');
}
