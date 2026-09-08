import * as Sentry from '@sentry/react-router';

const variant = process.env.SENTRY_VARIANT || 'base';

const integrations = [];
if (variant === 'explicit-nodefetch') {
  integrations.push(Sentry.nativeNodeFetchIntegration({ spans: true }));
}
if (variant === 'core-fetch-integration') {
  const { denoFetchIntegration } = await import('./deno-fetch-integration.mjs');
  integrations.push(denoFetchIntegration());
}
if (variant === 'cf-fetch-integration') {
  const { fetchIntegration } = await import('@sentry/cloudflare');
  integrations.push(fetchIntegration());
}
if (variant === 'undici-global') {
  const { fetch: undiciFetch } = await import('undici');
  globalThis.fetch = undiciFetch;
}

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  debug: process.env.SENTRY_DEBUG === '1',
  integrations,
});

console.log(
  '[instrument] variant=%s lifecycle=%s',
  variant,
  process.env.TRACE_LIFECYCLE || 'static',
);
