import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const tag = new URL(req.url).searchParams.get('tag') || 'none';
  Sentry.setTag('probe_tag', tag);
  await new Promise(resolve => setTimeout(resolve, 150 + Math.floor(Math.random() * 200)));
  Sentry.captureException(new Error(`iso-${tag}`));
  return Response.json({ tag });
}
