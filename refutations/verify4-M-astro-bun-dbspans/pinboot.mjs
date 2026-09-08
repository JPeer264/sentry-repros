// Workaround for Bun: `node:diagnostics_channel` does not keep a channel alive
// once it has subscribers, so Sentry's subscriptions vanish at the next GC.
// Creating the channels here and holding them on `globalThis` keeps the very
// same channel objects alive for the whole process.
import * as dc from 'node:diagnostics_channel';

globalThis.__sentryPinnedChannels = [
  'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
  'orchestrion:mysql:query', 'orchestrion:mysql2:query', 'orchestrion:mysql2:execute',
].map(name => dc.tracingChannel(name));

await import('./sentry.server.config.mjs');
