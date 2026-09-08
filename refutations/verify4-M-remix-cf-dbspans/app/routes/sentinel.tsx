import * as Sentry from '@sentry/cloudflare';

export async function loader() {
  Sentry.captureMessage('sentinel');
  return new Response('sentinel');
}
