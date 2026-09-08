import * as Sentry from '@sentry/astro';

const extra = [];
if (process.env.FETCH_FIX === 'cloudflare') {
  const { fetchIntegration } = await import('@sentry/cloudflare');
  extra.push(fetchIntegration());
}
if (process.env.FETCH_FIX === 'custom') {
  const { denoFetchIntegration } = await import('./fetch-integration.js');
  extra.push(denoFetchIntegration());
}

Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  debug: process.env.SDBG === '1',
  integrations: extra,
});
console.log('[cfg] sentry.server.config loaded, FETCH_FIX=' + process.env.FETCH_FIX);
