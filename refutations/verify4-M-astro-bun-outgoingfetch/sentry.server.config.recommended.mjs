import * as Sentry from '@sentry/astro';
import { fetchIntegration } from '@sentry/bun';

const isBun = typeof globalThis.Bun !== 'undefined';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
    sendDefaultPii: true,
    integrations: isBun ? [fetchIntegration()] : [],
  });
  console.log(`[probe] recommended config, isBun=${isBun}`);
}
