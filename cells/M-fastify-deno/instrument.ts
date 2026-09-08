import * as Sentry from "@sentry/deno";

const SINK_PORT = Deno.env.get("SINK_PORT") || "47021";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "stream",
  release: "m-fastify-deno@1",
  debug: false,
});
