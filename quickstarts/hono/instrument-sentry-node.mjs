// docs/platforms/javascript/common/install/esm.mdx:24-35 verbatim (the ESM install page lists javascript.hono at :11),
// plus the two repro-only options. Note the import: `@sentry/node`, not `@sentry/hono/node`.
import * as Sentry from "@sentry/node";

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
