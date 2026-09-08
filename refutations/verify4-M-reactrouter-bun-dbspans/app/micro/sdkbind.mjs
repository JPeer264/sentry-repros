import * as Sentry from '@sentry/react-router';
import { tracingChannel } from 'node:diagnostics_channel';

Sentry.init({ dsn: 'https://public@127.0.0.1/1', tracesSampleRate: 1.0, traceLifecycle: 'static' });

const check = tag => {
  for (const n of ['mysql2:query', 'mysql2:execute']) {
    console.log(tag, n, 'start.hasSubscribers=', tracingChannel(n).start?.hasSubscribers);
  }
};
check('[sync]');
setTimeout(() => check('[after 50ms]'), 50);
setTimeout(() => process.exit(0), 200);
