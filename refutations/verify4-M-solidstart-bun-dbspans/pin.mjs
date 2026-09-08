import dc from 'node:diagnostics_channel';
globalThis.__sentryPinnedChannels = [
  'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
].map(n => dc.tracingChannel(n));
