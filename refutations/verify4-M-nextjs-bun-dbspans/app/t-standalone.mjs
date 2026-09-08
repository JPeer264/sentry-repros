import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});
const { default: Redis } = await import('ioredis');
const client = new Redis({ host: '127.0.0.1', port: Number(process.env.REDIS_PORT) });
await Sentry.startSpan({ name: 'probe-root', op: 'test' }, async () => {
  await client.set('k', 'v');
  await client.get('k');
});
await Sentry.flush(3000);
await client.quit();
