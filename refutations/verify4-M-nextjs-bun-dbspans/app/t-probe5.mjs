import * as dc from 'node:diagnostics_channel';
import * as Sentry from '@sentry/node';
const N = 'tracing:ioredis:command:start';
// Hold a strong reference to the channel objects so they cannot be collected.
globalThis.__keep = [dc.tracingChannel('ioredis:command'), dc.tracingChannel('ioredis:connect'), dc.channel(N)];
Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});
console.log('sync subs=', dc.channel(N).hasSubscribers);
setTimeout(() => {
  console.log('t50 subs=', dc.channel(N).hasSubscribers);
  import('ioredis').then(async ({ default: Redis }) => {
    const c = new Redis({ host: '127.0.0.1', port: Number(process.env.REDIS_PORT) });
    await Sentry.startSpan({ name: 'probe-keepref', op: 'test' }, async () => {
      await c.set('k', 'v');
      await c.get('k');
    });
    await Sentry.flush(3000);
    await c.quit();
    process.exit(0);
  });
}, 50);
