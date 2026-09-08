import * as Sentry from '@sentry/cloudflare';

export function GET() {
  Sentry.captureException(new Error('trace-probe'));
  return new Response('ok');
}
