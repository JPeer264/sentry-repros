import * as Sentry from '@sentry/node';
import { getMainCarrier, getAsyncContextStrategy } from '@sentry/core';
console.log('BEFORE init strategy keys', Object.keys(getAsyncContextStrategy(getMainCarrier())));
Sentry.init({ dsn: 'https://public@localhost/1', tracesSampleRate: 1.0, traceLifecycle: 'static' });
const s = getAsyncContextStrategy(getMainCarrier());
console.log('AFTER init strategy keys', Object.keys(s));
console.log('getTracingChannelBinding?', typeof s.getTracingChannelBinding, 'value', !!s.getTracingChannelBinding?.());
setTimeout(() => {
  const s2 = getAsyncContextStrategy(getMainCarrier());
  console.log('TICK getTracingChannelBinding?', typeof s2.getTracingChannelBinding, 'value', !!s2.getTracingChannelBinding?.());
  process.exit(0);
}, 50);
