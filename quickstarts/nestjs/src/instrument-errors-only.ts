// platform-includes/getting-started-config/javascript.nestjs.mdx:1-33 with only the error-monitoring option
// (no tracesSampleRate), plus the two repro-only options.
import * as Sentry from "@sentry/nestjs";

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
});
