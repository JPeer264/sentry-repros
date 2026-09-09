// docs/platforms/javascript/guides/nitro/index.mdx:139-154 with only the "error-monitoring" option (no tracesSampleRate).
import * as Sentry from "@sentry/nitro";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
});
