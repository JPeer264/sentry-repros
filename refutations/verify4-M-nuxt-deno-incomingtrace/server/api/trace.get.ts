import * as Sentry from '@sentry/nuxt';
export default defineEventHandler(() => {
  const span = Sentry.getActiveSpan();
  const root = span ? Sentry.getRootSpan(span) : undefined;
  const json = root ? Sentry.spanToJSON(root) : undefined;
  return {
    hasActiveSpan: !!span,
    name: json?.description ?? null,
    op: json?.op ?? null,
    trace_id: json?.trace_id ?? null,
    parent_span_id: json?.parent_span_id ?? null,
    propagation: Sentry.getTraceData(),
  };
});
