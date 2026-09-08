import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  release: '1.0.0',
  environment: 'production',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
});
