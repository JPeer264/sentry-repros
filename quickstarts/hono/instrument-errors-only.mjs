// docs/platforms/javascript/guides/hono/index.mdx:167-198 with only the error-monitoring option (no tracesSampleRate),
// plus the two repro-only options.
import * as Sentry from "@sentry/hono/node";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
});
