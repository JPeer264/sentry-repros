import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || 'stream',
  environment: 'probe',
  debug: process.env.SDK_DEBUG === '1',
});

export const handle = Sentry.sentryHandle();
export const handleError = Sentry.handleErrorWithSentry();
