import * as dc from 'node:diagnostics_channel';
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  debug: true,
});
const names = ['tracing:ioredis:command:start', 'tracing:ioredis:command:asyncStart'];
setTimeout(() => {
  for (const n of names) {
    const c = dc.channel(n);
    console.log('PROBE', n, 'hasSubscribers=', c.hasSubscribers);
  }
  process.exit(0);
}, 100);
