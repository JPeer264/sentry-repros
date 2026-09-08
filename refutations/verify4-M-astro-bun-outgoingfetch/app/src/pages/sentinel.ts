import * as Sentry from '@sentry/astro';
export const prerender = false;
export async function GET() {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(2000);
  return new Response('sentinel');
}
