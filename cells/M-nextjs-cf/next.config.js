const { withSentryConfig } = require('@sentry/nextjs/config');

module.exports = withSentryConfig({}, { sourcemaps: { disable: true }, telemetry: false });
