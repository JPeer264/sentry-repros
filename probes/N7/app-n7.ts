import * as Sentry from "@sentry/bun";
import { trace } from "@opentelemetry/api";

const APP_PORT = Number(process.env.APP_PORT);
const ECHO_PORT = Number(process.env.ECHO_PORT);

// Echo target for the outgoing fetch: reports which trace headers arrived.
Bun.serve({
  port: ECHO_PORT,
  fetch(req) {
    return Response.json({
      "sentry-trace": req.headers.get("sentry-trace"),
      baggage: req.headers.get("baggage"),
      traceparent: req.headers.get("traceparent"),
    });
  },
});

const tracer = trace.getTracer("n7");

Bun.serve({
  port: APP_PORT,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    if (path === "/work") {
      // A span created through the OTEL API only, never through Sentry.startSpan.
      return await tracer.startActiveSpan("manual", async span => {
        const res = await fetch(`http://127.0.0.1:${ECHO_PORT}/echo`);
        const headers = await res.json();
        span.end();
        return Response.json({ ok: true, headers });
      });
    }

    if (path === "/error") {
      Sentry.captureException(new Error("n7-boom"));
      return new Response("captured\n");
    }

    if (path === "/sentinel") {
      Sentry.captureMessage("sentinel");
      return new Response("sentinel\n");
    }

    return new Response("ok\n");
  },
});

console.log(`[app] listening on ${APP_PORT}, echo on ${ECHO_PORT}`);
