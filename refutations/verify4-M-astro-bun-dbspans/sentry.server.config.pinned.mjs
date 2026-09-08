import * as Sentry from '@sentry/astro';
import dc from 'node:diagnostics_channel';

// Bun keeps `diagnostics_channel` channels in a weak registry and does not keep
// a channel with subscribers alive, so every subscription is dropped at the next
// GC. Holding each channel in a global array keeps them reachable.
if (typeof globalThis.Bun !== 'undefined' && !globalThis.__sentryPinnedChannels) {
  const pinned = (globalThis.__sentryPinnedChannels = []);
  const origChannel = dc.channel.bind(dc);
  const origTracingChannel = dc.tracingChannel.bind(dc);
  dc.channel = name => {
    const c = origChannel(name);
    pinned.push(c);
    return c;
  };
  dc.tracingChannel = name => {
    const tc = origTracingChannel(name);
    pinned.push(tc);
    return tc;
  };
}

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:44311/',
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  });
}
