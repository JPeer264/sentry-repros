import * as Sentry from '@sentry/remix';

const integrations = [];
if (process.env.SENTRY_VARIANT === 'core-fetch') {
  const { denoFetchIntegration } = await import('./deno-fetch-integration.mjs');
  integrations.push(denoFetchIntegration());
}

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: process.env.SINK_URL,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  environment: 'probe',
  debug: process.env.SENTRY_DEBUG === '1',
  integrations,
});
console.log('[probe] sentry initialized:', Sentry.isInitialized(), 'lifecycle:', process.env.TRACE_LIFECYCLE || 'static');
