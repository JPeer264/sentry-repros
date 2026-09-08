import * as Sentry from '@sentry/tanstackstart-react';
import diagnosticsChannel from 'node:diagnostics_channel';

Sentry.init({
  dsn: 'http://public@localhost:41733/1337',
  tunnel: 'http://127.0.0.1:41733/',
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE ?? 'static',
  debug: true,
});

// Bun 1.4.0 drops diagnostics_channel subscribers once the channel object is
// garbage collected, so hold the channels the SDK subscribed to.
globalThis.__sentryKeepChannelsAlive = [
  'orchestrion:mysql:query',
  'orchestrion:mysql2:query',
  'orchestrion:mysql2:execute',
].map(name => diagnosticsChannel.tracingChannel(name));

console.log('[probe] sentry initialized, client =', !!Sentry.getClient());
