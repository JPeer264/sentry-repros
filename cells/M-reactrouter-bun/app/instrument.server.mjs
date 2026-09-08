import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT || "52817"}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  debug: !!process.env.SENTRY_DEBUG,
});
