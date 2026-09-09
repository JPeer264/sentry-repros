// manual-setup/index.mdx:84-118 verbatim (all four product options), plus `tunnel` to the local sink and `debug: true`.
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "http://public@localhost:4762/1",
  tunnel: "http://localhost:4762/tunnel",
  debug: true,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production.
  // Learn more at https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error.
  // Learn more at https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
