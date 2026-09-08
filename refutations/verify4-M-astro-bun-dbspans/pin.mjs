// Pin diagnostics channels so Bun's GC cannot collect them and silently drop
// subscribers. Must run BEFORE Sentry.init so the SDK subscribes to the pinned
// channel objects.
import * as dc from 'node:diagnostics_channel';

const PINNED = [];
globalThis.__PINNED_CHANNELS__ = PINNED;

for (const name of [
  'orchestrion:mysql2:query',
  'orchestrion:mysql2:execute',
  'orchestrion:mysql:query',
]) {
  PINNED.push(dc.tracingChannel(name));
}

await import('./sentry.server.config.mjs');
