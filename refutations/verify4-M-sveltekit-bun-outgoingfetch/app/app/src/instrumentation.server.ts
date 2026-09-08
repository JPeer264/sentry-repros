import dc from 'node:diagnostics_channel';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://abc@o1.ingest.sentry.io/1',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
});

