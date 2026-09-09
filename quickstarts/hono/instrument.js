// platform-includes/getting-started-config/javascript.hono.mdx:1-35 (CommonJS tab, rendered by
// docs/platforms/javascript/common/install/commonjs.mdx:25 for javascript.hono), error-monitoring + performance,
// plus the two repro-only options. Note the require: `@sentry/node`, not `@sentry/hono/node`.
const Sentry = require("@sentry/node");

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/hono/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
});
