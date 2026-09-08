import * as Sentry from '@sentry/solidstart';
import dc from 'node:diagnostics_channel';
import { definePlugin } from 'nitro';

export default definePlugin(() => {
  Sentry.init({
    dsn: 'https://public@dsn.ingest.sentry.io/1337',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.SENTRY_LIFECYCLE || 'static',
    debug: !!process.env.SENTRY_DEBUG,
  });

  if (process.env.PIN_CHANNELS) {
    // Bun collects diagnostics_channel channels that still have subscribers but
    // no other strong reference, which silently unsubscribes Sentry's library
    // instrumentation. Holding the tracing channels keeps them alive.
    (globalThis as Record<string, unknown>).__sentryPinnedChannels = [
      'mysql2:query',
      'mysql2:execute',
      'mysql2:connect',
      'mysql2:pool:connect',
      'orchestrion:mysql:query',
      'orchestrion:mysql2:query',
      'orchestrion:mysql2:execute',
    ].map(name => dc.tracingChannel(name));
  }
});
