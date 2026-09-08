import * as Sentry from '@sentry/remix';
import { fetchIntegration, bunHttpServerIntegration } from '@sentry/bun';

const variant = process.env.PROBE_VARIANT || 'baseline';
const lifecycle = process.env.PROBE_LIFECYCLE || 'static';

const integrations = [];
if (variant === 'bunfetch' || variant === 'bunall') {
  integrations.push(fetchIntegration());
}
if (variant === 'bunall') {
  integrations.push(bunHttpServerIntegration());
}

Sentry.init({
  dsn: 'http://public@127.0.0.1:1/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  environment: 'probe',
  tracesSampleRate: 1.0,
  traceLifecycle: lifecycle,
  integrations,
  debug: process.env.PROBE_DEBUG === '1',
});

// eslint-disable-next-line no-console
console.log(`[probe] variant=${variant} lifecycle=${lifecycle} initialized=${Sentry.isInitialized()}`);
