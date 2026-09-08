import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') || 'none';
  Sentry.setTag('probe_tag', t);
  await new Promise(resolve => setTimeout(resolve, 120));
  Sentry.captureException(new Error(`iso-${t}`));
  return Response.json({ t });
}
