import sentryConfigModule from '@sentry/nextjs/config';

const { withSentryConfig } = sentryConfigModule;

export default withSentryConfig(
  {},
  { silent: true, sourcemaps: { disable: true }, telemetry: false, disableLogger: true },
);
