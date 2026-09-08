import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  Sentry.logger.info('probe-log-from-route-handler', { where: 'nextjs-deno' });
  return Response.json({ ok: true });
}
