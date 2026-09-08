import * as Sentry from '@sentry/sveltekit';

const extra = [];
if (process.env.FETCHFIX === 'cloudflare') {
  const { fetchIntegration } = await import('@sentry/cloudflare');
  extra.push(fetchIntegration());
} else if (process.env.FETCHFIX === 'userland') {
  const { denoFetchIntegration } = await import('./userland-fetch-integration.js');
  extra.push(denoFetchIntegration());
}

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  debug: process.env.SDK_DEBUG === '1',
  integrations: extra,
});

export const handle = Sentry.sentryHandle();
export const handleError = Sentry.handleErrorWithSentry();
