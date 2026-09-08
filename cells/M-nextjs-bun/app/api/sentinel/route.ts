import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const n = new URL(req.url).searchParams.get('n') || '1';
  Sentry.captureMessage(`sentinel-${n}`);
  await Sentry.flush(3000);
  return Response.json({ sentinel: n });
}
