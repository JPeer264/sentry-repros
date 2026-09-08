import diagnosticsChannel from 'node:diagnostics_channel';

/**
 * On bun 1.4.0 a diagnostics-channel subscriber does not keep its channel alive, so the SDK's
 * eager subscriptions are dropped at the first GC and mysql2's `shouldTrace()` gate stays closed.
 * Holding the tracing channels on globalThis keeps the subscribed channel objects reachable.
 */
function keepSentryChannelsAlive(): void {
  const names = ['mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect'];
  (globalThis as Record<string, unknown>).__sentryKeptChannels = names.map(name =>
    diagnosticsChannel.tracingChannel(name),
  );
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    if (process.env.KEEP_CHANNELS === '1') {
      keepSentryChannelsAlive();
    }
  }
}
export { captureRequestError as onRequestError } from '@sentry/nextjs';
