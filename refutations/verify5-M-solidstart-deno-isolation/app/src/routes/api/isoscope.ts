import * as Sentry from '@sentry/solidstart';
import type { APIEvent } from '@solidjs/start/server';
import { snapshot } from './scopeid';

export async function GET(event: APIEvent) {
  const tag = new URL(event.request.url).searchParams.get('tag') || 'none';
  const inner = await Sentry.withScope(async scope => {
    scope.setTag('probe-tag', tag);
    await new Promise(r => setTimeout(r, 150));
    Sentry.captureException(new Error(`isoscope-${tag}`));
    return snapshot('inside');
  });
  return new Response(JSON.stringify({ tag, inner, after: snapshot('after') }), {
    headers: { 'content-type': 'application/json' },
  });
}
