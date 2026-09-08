import * as Sentry from '@sentry/astro';
import { fetchIntegration as bunFetchIntegration } from '@sentry/bun';

const variant = process.env.PROBE_VARIANT || 'baseline';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
    sendDefaultPii: true,
    debug: process.env.SENTRY_DEBUG === '1',
    integrations: variant === 'bunfetch' ? [bunFetchIntegration()] : [],
  });
  // eslint-disable-next-line
  console.log(`[probe] sentry init variant=${variant} lifecycle=${process.env.TRACE_LIFECYCLE || 'static'}`);
}
