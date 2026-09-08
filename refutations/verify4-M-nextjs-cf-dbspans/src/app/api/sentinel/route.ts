import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(3000);
  return Response.json({ ok: true });
}
