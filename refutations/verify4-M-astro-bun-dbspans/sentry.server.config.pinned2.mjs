import * as Sentry from '@sentry/astro';
import * as dc from 'node:diagnostics_channel';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:44311/',
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  });
}

// Bun's `diagnostics_channel` registry is weak and does not keep a channel with
// subscribers alive, so Sentry's subscriptions are dropped at the next GC.
// Holding the channel objects on `globalThis` keeps them reachable.
globalThis.__sentryPinnedChannels ??= [
  'orchestrion:mysql2:query', 'orchestrion:mysql2:execute', 'orchestrion:mysql:query',
  'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
].map(name => dc.tracingChannel(name));
