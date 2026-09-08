import * as Sentry from '@sentry/solidstart';
import type { APIEvent } from '@solidjs/start/server';
import { snapshot } from './scopeid';

export async function GET(event: APIEvent) {
  const tag = new URL(event.request.url).searchParams.get('tag');
  const before = snapshot('before');
  if (tag) Sentry.setTag('probe-tag', tag);
  const afterTag = snapshot('afterTag');
  await new Promise(r => setTimeout(r, 150));
  const afterSleep = snapshot('afterSleep');
  Sentry.captureException(new Error(`iso-${tag || 'notag'}`));
  return new Response(JSON.stringify({ tag, before, afterTag, afterSleep }), {
    headers: { 'content-type': 'application/json' },
  });
}
