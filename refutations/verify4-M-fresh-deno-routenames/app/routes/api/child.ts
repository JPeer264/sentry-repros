import * as Sentry from "@sentry/deno";
import { trace } from "@opentelemetry/api";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET() {
    return Sentry.startSpan({ name: "work", op: "custom" }, () => {
      const otelName = trace.getActiveSpan()
        ? (trace.getActiveSpan() as unknown as { _name?: string })._name
        : "none";
      const tracerSpan = trace.getTracer("probe").startSpan("via-tracer");
      tracerSpan.end();
      return new Response(JSON.stringify({ otelName }), {
        headers: { "content-type": "application/json" },
      });
    });
  },
});
