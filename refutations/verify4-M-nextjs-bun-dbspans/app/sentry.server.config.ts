import * as dc from 'node:diagnostics_channel';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
  debug: process.env.SENTRY_DEBUG === '1',
});

// Bun garbage-collects `diagnostics_channel` channels that only the SDK's own subscriber
// references, so the subscriptions Sentry.init() made are gone one tick later and no db span is
// ever recorded. Holding the channels in a module-scope value keeps the subscriptions alive.
(globalThis as Record<string, unknown>).__sentryKeptChannels = [
  'mysql2:query',
  'mysql2:execute',
  'mysql2:connect',
  'mysql2:pool:connect',
  'ioredis:command',
  'ioredis:connect',
].map(name => dc.tracingChannel(name));

if (process.env.SENTRY_NO_PIN === '1') {
  (globalThis as Record<string, unknown>).__sentryKeptChannels = undefined;
}
