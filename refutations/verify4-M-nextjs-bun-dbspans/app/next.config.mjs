import { withSentryConfig } from '@sentry/nextjs/config';

export default withSentryConfig(
  {},
  { silent: true, sourcemaps: { disable: true }, telemetry: false, disableLogger: true },
);
