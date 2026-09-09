// docs/platforms/javascript/guides/gatsby/index.mdx:115-153 with error-monitoring, performance,
// session-replay and user-feedback selected. Added for this reproduction: `tunnel` (the guide's
// tunneling step, platform-includes/getting-started-tunneling/javascript.mdx:14-17, pointed at the
// local sink on its own port because `gatsby serve` has no proxy), `debug: true` (not in the guide,
// only to get the SDK's own log lines into the console record), `window.Sentry` and the driver
// hooks at the bottom.
import * as Sentry from "@sentry/gatsby";
import { installHarness } from "./src/harness";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "http://localhost:4768/tunnel",
  debug: true,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// The plugin prepends this file to every webpack entry, including the `build-html` (SSR) bundle
// that runs in Node during `gatsby build`, so the driver hooks are guarded.
if (typeof window !== "undefined") {
  window.Sentry = Sentry;
  installHarness();
}
