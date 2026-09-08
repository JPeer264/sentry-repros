import * as Sentry from '@sentry/cloudflare';

export function GET() {
  Sentry.captureMessage('sentinel');
  return new Response('{"sentinel":true}', { headers: { 'content-type': 'application/json' } });
}
