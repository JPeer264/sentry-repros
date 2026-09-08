import * as Sentry from '@sentry/solidstart';

export async function GET() {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(3000);
  return new Response('sentinel');
}
