import * as Sentry from "@sentry/bun";

const integrations = [];
if (process.env.CAPTURE_CONSOLE === "1") {
  integrations.push(Sentry.captureConsoleIntegration({ levels: ["error"] }));
}

Sentry.init({
  dsn: "https://public@example.ingest.sentry.io/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as "static" | "stream") ?? "stream",
  debug: process.env.SENTRY_DEBUG === "1",
  integrations,
});
