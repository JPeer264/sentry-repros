import * as Sentry from "@sentry/node";

// The v11 place for shouldHandleError, from
// docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:735-743.
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  integrations: [
    Sentry.expressIntegration({
      shouldHandleError(error) {
        return Number(error.statusCode ?? 500) >= 400;
      },
    }),
  ],
  tracesSampleRate: 1.0,
});
