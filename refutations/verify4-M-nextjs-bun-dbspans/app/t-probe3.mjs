import * as dc from 'node:diagnostics_channel';
import { createRequire } from 'node:module';
import * as Sentry from '@sentry/node';
const require = createRequire(import.meta.url);
Sentry.init({ dsn: 'https://public@localhost/1', tracesSampleRate: 1.0, traceLifecycle: 'static' });
console.log('after init subs=', dc.channel('tracing:ioredis:command:start').hasSubscribers);
const sub = require('@sentry/server-utils/build/cjs/integrations/redis/redis-dc-subscriber.js');
console.log('exports', Object.keys(sub).join(','));
try {
  sub.subscribeRedisDiagnosticChannels(dc.tracingChannel, {});
  console.log('manual subscribe OK, subs=', dc.channel('tracing:ioredis:command:start').hasSubscribers);
} catch (e) {
  console.log('manual subscribe THREW', e && e.message);
}
process.exit(0);
