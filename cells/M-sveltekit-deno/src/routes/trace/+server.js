import * as Sentry from '@sentry/sveltekit';

export function GET() {
  const span = Sentry.getActiveSpan();
  const ctx = span ? Sentry.spanToJSON(span) : {};
  const seen = { trace_id: ctx.trace_id, parent_span_id: ctx.parent_span_id, span_id: ctx.span_id };
  console.log('handler saw:', JSON.stringify(seen));
  Sentry.captureMessage('trace-probe');
  return new Response(JSON.stringify(seen));
}
