import * as Sentry from "@sentry/bun";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const tag = ctx.params.tag;
    Sentry.setTag("probe_tag", tag);
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
    Sentry.setTag("probe_tag_after", tag);
    const id = Sentry.captureException(new Error(`iso-${tag}`));
    const span = Sentry.getActiveSpan();
    const traceId = span
      ? Sentry.spanToJSON(span).trace_id
      : Sentry.getCurrentScope().getPropagationContext().traceId;
    return new Response(JSON.stringify({ tag, id, traceId }), {
      headers: { "content-type": "application/json" },
    });
  },
});
