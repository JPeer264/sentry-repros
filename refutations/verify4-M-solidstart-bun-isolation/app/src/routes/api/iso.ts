import * as Sentry from '@sentry/solidstart';
import { getTraceData } from '@sentry/core';

export async function GET({ request }: { request: Request }) {
  const tag = new URL(request.url).searchParams.get('tag') || 'none';
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 250)));
  Sentry.captureException(new Error(`iso-${tag}`));
  const td = getTraceData();
  return Response.json({ tag, traceparent: td['sentry-trace'] });
}
