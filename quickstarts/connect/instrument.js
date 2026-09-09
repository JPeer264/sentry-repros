// platform-includes/getting-started-config/javascript.node.mdx:1-35 (CommonJS tab, error-monitoring + performance),
// plus the two repro-only options.
const Sentry = require("@sentry/node");

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  // Repro-only additions: deliver envelopes to the local sink and print init debug output.
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
});
