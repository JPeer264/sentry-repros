import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  Sentry.logger.info('M-nextjs-bun log from route handler', { probe: 'logs' });
  return Response.json({ ok: true });
}
