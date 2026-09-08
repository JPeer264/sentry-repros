import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://0299849066e3bcf4626b214897b6c17f@o447951.ingest.us.sentry.io/4510555608449024",
  release: process.env.SENTRY_RELEASE ?? "temp-eve-sentry@dev",
  tracesSampleRate: 1.0,
  integrations: [Sentry.vercelAIIntegration()],
  debug: true,
  sendDefaultPii: true,
});
