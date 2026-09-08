const { withSentryConfig } = require('@sentry/nextjs/config');

// Variant D: the documented wiring, unmodified.
module.exports = withSentryConfig(
  {},
  {
    sourcemaps: { disable: true },
    telemetry: false,
    silent: false,
  },
);
