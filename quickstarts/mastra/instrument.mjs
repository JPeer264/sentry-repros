// Repro-only: plain @sentry/node init for the sdk-only and both variants (the Mastra guide has no Sentry.init snippet).
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: true,
});
