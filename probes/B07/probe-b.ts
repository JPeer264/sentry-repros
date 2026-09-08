import * as Sentry from '@sentry/bun';
import { consoleLoggingIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'https://abc@o0.ingest.sentry.io/0',
  tunnel: process.env.TUNNEL,
  tracesSampleRate: 1.0,
  integrations: [consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })],
});

console.log('typeof consoleLoggingIntegration:', typeof consoleLoggingIntegration);
console.warn('hello');

await new Promise(r => setTimeout(r, 7000));
console.log('done');
await Sentry.flush(3000);
