import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  Sentry.logger.info('m-nextjs-cf log from route handler', { probe: 'logs' });
  return Response.json({ ok: true });
}
