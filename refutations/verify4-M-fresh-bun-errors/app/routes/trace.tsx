import * as Sentry from "@sentry/bun";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET() {
    const span = Sentry.getActiveSpan();
    const root = span ? Sentry.getRootSpan(span) : undefined;
    const j = root ? Sentry.spanToJSON(root) : undefined;
    Sentry.captureMessage("trace-probe");
    return new Response(
      JSON.stringify({
        hasSpan: !!span,
        traceId: j?.trace_id ?? Sentry.getCurrentScope().getPropagationContext().traceId,
        parentSpanId: j?.parent_span_id ?? null,
        name: j?.description ?? null,
      }),
      { headers: { "content-type": "application/json" } },
    );
  },
});
