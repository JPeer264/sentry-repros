import * as Sentry from '@sentry/tanstackstart-react';

const variant = process.env.PROBE_VARIANT || 'baseline';
const integrations = [];

if (variant === 'bunfetch' || variant === 'bunall') {
  const { fetchIntegration, bunHttpServerIntegration } = await import('@sentry/bun');
  integrations.push(fetchIntegration());
  if (variant === 'bunall') {
    integrations.push(bunHttpServerIntegration());
  }
}

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.PROBE_LIFECYCLE || 'static',
  debug: process.env.PROBE_DEBUG === '1',
  integrations,
});

globalThis.__PROBE_SENTRY__ = Sentry;
console.log(`[probe] variant=${variant} lifecycle=${process.env.PROBE_LIFECYCLE || 'static'} client=${!!Sentry.getClient()} runtime=${typeof globalThis.Bun !== 'undefined' ? 'bun' : 'node'}`);
