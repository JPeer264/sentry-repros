import * as Sentry from '@sentry/remix';

const disableInjection = process.env.DISABLE_CHANNEL_INJECTION === '1';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: process.env.SINK_URL,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  environment: 'probe',
  debug: process.env.SENTRY_DEBUG === '1',
  ...(disableInjection ? { enableRuntimeChannelInjection: false } : {}),
});
console.log(
  '[probe] sentry initialized:', Sentry.isInitialized(),
  'lifecycle:', process.env.TRACE_LIFECYCLE || 'static',
  'channelInjection:', disableInjection ? 'off' : 'on',
);
