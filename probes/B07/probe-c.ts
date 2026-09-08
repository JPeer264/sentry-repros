import * as Sentry from '@sentry/bun';
import { consoleLoggingIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'https://abc@o0.ingest.sentry.io/0',
  tunnel: process.env.TUNNEL,
  tracesSampleRate: 1.0,
  // `enableLogs` does not exist on develop; passed here to show it changes nothing.
  enableLogs: true,
  integrations: [consoleLoggingIntegration({ levels: ['warn', 'error'] })],
} as Parameters<typeof Sentry.init>[0]);

Sentry.logger.info('probe info', { probe: 'B07', n: 1, ok: true });
Sentry.logger.warn('probe warn', { probe: 'B07', n: 2, ok: true });
Sentry.logger.error('probe error', { probe: 'B07', n: 3, ok: false, tag: 'x' });
console.warn('hello');

await new Promise(r => setTimeout(r, 7000));
await Sentry.flush(3000);
