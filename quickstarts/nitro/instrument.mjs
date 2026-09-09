// docs/platforms/javascript/guides/nitro/index.mdx:139-154 (error-monitoring + performance), plus the two repro-only options.
import * as Sentry from "@sentry/nitro";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  // Repro-only additions: deliver envelopes to the local sink and print init debug output.
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/nitro/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
});
