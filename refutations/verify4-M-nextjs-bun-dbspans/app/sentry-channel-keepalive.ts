import * as dc from 'node:diagnostics_channel';

// Bun collects `diagnostics_channel` Channel objects that only the SDK's subscriber references, so
// every channel-based integration silently loses its subscription one tick after `Sentry.init()`.
// Pinning each channel in a module-scope array keeps it alive.
const keepAlive: unknown[] = [];
(globalThis as Record<string, unknown>).__sentryChannelKeepAlive = keepAlive;

const anyDc = dc as unknown as Record<string, (name: string) => Record<string, unknown>>;
const originalChannel = anyDc.channel;
const originalTracingChannel = anyDc.tracingChannel;

anyDc.channel = (name: string) => {
  const channel = originalChannel(name);
  keepAlive.push(channel);
  return channel;
};

anyDc.tracingChannel = (name: string) => {
  const channel = originalTracingChannel(name);
  keepAlive.push(channel, channel.start, channel.end, channel.asyncStart, channel.asyncEnd, channel.error);
  return channel;
};

setTimeout(() => {
  console.log(
    'KEEPALIVE pinned=',
    keepAlive.length,
    'ioredisSubs=',
    (dc.channel('tracing:ioredis:command:start') as unknown as { hasSubscribers: boolean }).hasSubscribers,
  );
}, 200);
