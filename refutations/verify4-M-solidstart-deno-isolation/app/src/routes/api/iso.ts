import { getDefaultIsolationScope, getIsolationScope } from '@sentry/core';
import * as Sentry from '@sentry/solidstart';
import type { APIEvent } from '@solidjs/start/server';

let n = 0;

export async function GET(event: APIEvent) {
  const tag = new URL(event.request.url).searchParams.get('tag') || 'none';
  const iso = getIsolationScope() as any;
  const def = getDefaultIsolationScope() as any;
  if (!iso.__id) iso.__id = `scope${++n}`;
  if (!def.__id) def.__id = 'DEFAULT';
  console.log(`[iso ${tag}] id=${iso.__id} entryTags=${JSON.stringify(iso._tags)} defaultTags=${JSON.stringify(def._tags)}`);
  Sentry.setTag('probe-tag', tag);
  await new Promise(r => setTimeout(r, 150));
  Sentry.captureException(new Error(`iso-${tag}`));
  return new Response(JSON.stringify({ tag }), { headers: { 'content-type': 'application/json' } });
}
