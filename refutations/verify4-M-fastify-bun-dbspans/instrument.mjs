import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://public@localhost/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || "static",
  debug: process.env.SDEBUG === "1",
});
