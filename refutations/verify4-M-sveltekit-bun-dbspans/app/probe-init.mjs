import dc from 'node:diagnostics_channel';
import * as Sentry from '@sentry/sveltekit';
import { getAsyncContextStrategy, getMainCarrier } from '@sentry/core';

console.log('before init subs:', dc.tracingChannel('mysql2:query').start.hasSubscribers);
Sentry.init({ dsn: 'https://abc@o1.ingest.sentry.io/1', tracesSampleRate: 1.0 });
const acs = getAsyncContextStrategy(getMainCarrier());
console.log('binding after init:', !!acs.getTracingChannelBinding?.());
console.log('after init subs:', dc.tracingChannel('mysql2:query').start.hasSubscribers);
setTimeout(() => {
  console.log('after 1 tick subs:', dc.tracingChannel('mysql2:query').start.hasSubscribers);
  console.log('binding later:', !!getAsyncContextStrategy(getMainCarrier()).getTracingChannelBinding?.());
}, 50);
