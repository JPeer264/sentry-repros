import * as Sentry from '@sentry/cloudflare';

export const prerender = false;

export function GET() {
  Sentry.captureMessage('sentinel');
  return new Response('ok');
}
