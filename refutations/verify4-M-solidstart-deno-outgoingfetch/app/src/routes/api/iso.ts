import * as Sentry from '@sentry/solidstart';
import type { APIEvent } from '@solidjs/start/server';

export async function GET(event: APIEvent) {
  const tag = new URL(event.request.url).searchParams.get('tag') || 'none';
  Sentry.setTag('probe-tag', tag);
  await new Promise(r => setTimeout(r, 150));
  Sentry.captureException(new Error(`iso-${tag}`));
  return new Response(JSON.stringify({ tag }), { headers: { 'content-type': 'application/json' } });
}
