import * as Sentry from '@sentry/bun';
import { nestIntegration } from '@sentry/nestjs';

const sinkPort = process.env.SINK_PORT || '9999';

Sentry.init({
  dsn: 'http://publickey@127.0.0.1:9999/1',
  tunnel: `http://127.0.0.1:${sinkPort}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'stream' | 'static') || 'stream',
  integrations: process.env.SENTRY_NEST === '1' ? [nestIntegration()] : [],
});
