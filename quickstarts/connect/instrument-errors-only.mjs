// platform-includes/getting-started-config/javascript.node.mdx:37-70 with only the "error-monitoring"
// onboarding option selected (no tracesSampleRate), plus the two repro-only options.
import * as Sentry from "@sentry/node";

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
});
