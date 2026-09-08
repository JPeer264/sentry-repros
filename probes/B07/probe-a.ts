import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://abc@o0.ingest.sentry.io/0',
  tunnel: process.env.TUNNEL,
  tracesSampleRate: 1.0,
});

const client = Sentry.getClient();
console.log('enableLogs option value:', (client?.getOptions() as Record<string, unknown> | undefined)?.enableLogs);

Sentry.logger.info('probe info', { probe: 'B07', n: 1, ok: true });
Sentry.logger.warn('probe warn', { probe: 'B07', n: 2, ok: true });
Sentry.logger.error('probe error', { probe: 'B07', n: 3, ok: false, tag: 'x' });

await new Promise(r => setTimeout(r, 7000));
await Sentry.flush(3000);
