import * as dc from 'node:diagnostics_channel';
await import('./sentry.server.config.mjs');
const read = () => dc.tracingChannel('mysql2:query').start.hasSubscribers;
console.log('[T] sync after init:', read());
for (const ms of [0, 5, 100, 1000, 3000]) {
  setTimeout(() => console.log(`[T] +${ms}ms:`, read()), ms).unref?.();
}
