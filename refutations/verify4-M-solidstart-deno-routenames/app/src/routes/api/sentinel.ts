import * as Sentry from '@sentry/solidstart';

export function GET() {
  Sentry.captureMessage('sentinel');
  return new Response('ok');
}
