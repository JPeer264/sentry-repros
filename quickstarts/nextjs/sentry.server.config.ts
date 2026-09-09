import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 100% in dev, 10% in production
  // Adjust based on your traffic volume
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Repro additions, not on the docs page: the driver needs every trace and the SDK's debug output.
  debug: true,
  tracesSampler: () => 1.0,
});
