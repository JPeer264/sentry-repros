import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT || '41337'}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  enableRuntimeChannelInjection: process.env.RUNTIME_INJECTION === '1',
  debug: true,
});
