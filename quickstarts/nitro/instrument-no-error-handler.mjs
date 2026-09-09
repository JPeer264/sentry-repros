// docs/platforms/javascript/guides/nitro/index.mdx:277-282, verbatim plus the two repro-only options.
import * as Sentry from "@sentry/nitro";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  enableNitroErrorHandler: false,
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
});
