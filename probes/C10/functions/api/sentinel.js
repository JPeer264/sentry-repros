import * as Sentry from '@sentry/cloudflare';

export function onRequest() {
  Sentry.captureMessage('sentinel');
  return new Response('sentinel sent\n');
}
