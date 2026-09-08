import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tracesSampleRate: 1.0,
  tunnel: 'http://127.0.0.1:33517/',
  environment: 'probe',
  release: 'm-tanstack-cf',
});
