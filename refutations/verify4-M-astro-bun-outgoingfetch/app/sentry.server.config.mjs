import * as Sentry from '@sentry/astro';
import { fetchIntegration as bunFetchIntegration } from '@sentry/bun';

const isBun = typeof globalThis.Bun !== 'undefined';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://abc@o1.ingest.sentry.io/1',
    tunnel: process.env.SENTRY_SINK,
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.SENTRY_LIFECYCLE || 'static',
    sendDefaultPii: true,
    integrations: isBun ? [bunFetchIntegration()] : [],
  });
}
