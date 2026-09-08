import * as Sentry from '@sentry/solidstart';

export function GET() {
  const span = Sentry.getActiveSpan();
  const root = span ? Sentry.getRootSpan(span) : undefined;
  const json = root ? Sentry.spanToJSON(root) : null;
  return new Response(
    JSON.stringify({
      activeTraceId: span ? Sentry.spanToJSON(span).trace_id : null,
      rootTraceId: json?.trace_id ?? null,
      rootParentSpanId: json?.parent_span_id ?? null,
      rootName: json?.description ?? null,
      propagationTraceId: Sentry.getTraceData()['sentry-trace']?.split('-')[0] ?? null,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}
