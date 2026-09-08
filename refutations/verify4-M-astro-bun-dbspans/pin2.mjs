import * as dc from 'node:diagnostics_channel';
const PINNED = [];
globalThis.__PINNED_CHANNELS__ = PINNED;
for (const name of [
  'orchestrion:mysql2:query', 'orchestrion:mysql2:execute', 'orchestrion:mysql:query',
  'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
]) {
  PINNED.push(dc.tracingChannel(name));
}
await import('./sentry.server.config.mjs');
