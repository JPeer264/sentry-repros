import sentryConfigModule from '@sentry/nextjs/config';
const { withSentryConfig } = sentryConfigModule;
export default withSentryConfig({ distDir: '.next-v4auto' }, { silent: true, sourcemaps: { disable: true }, telemetry: false });
