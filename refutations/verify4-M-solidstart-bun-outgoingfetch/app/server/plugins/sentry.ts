import { fetchIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';

const isBun = typeof (globalThis as any).Bun !== 'undefined';

export default definePlugin(() => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://public@dsn.ingest.sentry.io/1337',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as any) || 'static',
    debug: !!process.env.SENTRY_DEBUG,
    // Bun's native fetch does not emit the undici diagnostics channels the Node SDK listens on.
    integrations: isBun ? [fetchIntegration()] : [],
  });
});
