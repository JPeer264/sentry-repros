import * as Sentry from '@sentry/astro';
import * as dc from 'node:diagnostics_channel';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: process.env.SENTRY_TUNNEL || 'http://127.0.0.1:53117/',
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.TRACE_LIFECYCLE || 'stream',
  });
}

// Bun drops diagnostics_channel subscriptions at the next GC; keep the channel
// objects reachable so Sentry's subscriptions survive.
globalThis.__sentryPinnedChannels ??= [
  'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
  'orchestrion:mysql:query', 'orchestrion:mysql2:query', 'orchestrion:mysql2:execute',
].map(name => dc.tracingChannel(name));
