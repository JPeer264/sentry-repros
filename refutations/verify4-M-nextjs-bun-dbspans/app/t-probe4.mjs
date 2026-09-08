import * as dc from 'node:diagnostics_channel';
import * as Sentry from '@sentry/node';
const N = 'tracing:ioredis:command:start';
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
    console.log('after import subs=', dc.channel(N).hasSubscribers);
    const c = new Redis({ host: '127.0.0.1', port: Number(process.env.REDIS_PORT) });
    await Sentry.startSpan({ name: 'probe-root2', op: 'test' }, async () => {
      await c.set('k', 'v');
      await c.get('k');
    });
    console.log('after cmds subs=', dc.channel(N).hasSubscribers);
    await Sentry.flush(3000);
    await c.quit();
    process.exit(0);
  });
}, 50);
