import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://public@example.ingest.sentry.io/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as "static" | "stream") ?? "stream",
  debug: process.env.SENTRY_DEBUG === "1",
});
