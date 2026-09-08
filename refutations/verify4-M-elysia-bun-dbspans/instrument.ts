import * as Sentry from '@sentry/elysia';

Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tunnel: 'http://127.0.0.1:41872/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  environment: 'qa',
});
