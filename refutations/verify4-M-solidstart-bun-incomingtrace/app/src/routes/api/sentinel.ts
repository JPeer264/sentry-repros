import * as Sentry from '@sentry/solidstart';

export async function GET() {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(2000);
  return new Response('ok');
}
