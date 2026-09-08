import { getDefaultIsolationScope, getIsolationScope } from '@sentry/core';
import * as Sentry from '@sentry/solidstart';

export function GET() {
  const iso = getIsolationScope() as any;
  const def = getDefaultIsolationScope() as any;
  console.log(`[sentinel] id=${iso.__id ?? 'new'} entryTags=${JSON.stringify(iso._tags)} defaultTags=${JSON.stringify(def._tags)}`);
  Sentry.captureMessage('sentinel');
  return new Response('{"sentinel":true}', { headers: { 'content-type': 'application/json' } });
}
