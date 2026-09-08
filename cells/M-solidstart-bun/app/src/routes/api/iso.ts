import * as Sentry from '@sentry/solidstart';
import type { APIEvent } from '@solidjs/start/server';

export async function GET(event: APIEvent) {
  const tag = new URL(event.request.url).searchParams.get('tag') || 'none';
  Sentry.setTag('probe_tag', tag);
  await new Promise(r => setTimeout(r, 150));
  Sentry.captureException(new Error(`iso-error-${tag}`));

  const span = Sentry.getActiveSpan();
  const traceId = span
    ? Sentry.spanToJSON(Sentry.getRootSpan(span)).trace_id
    : Sentry.getCurrentScope().getPropagationContext().traceId;

  return new Response(JSON.stringify({ tag, traceId }), {
    headers: { 'content-type': 'application/json' },
  });
}
