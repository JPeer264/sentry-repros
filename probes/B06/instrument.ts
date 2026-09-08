import * as Sentry from '@sentry/bun';

const port = process.env.SINK_PORT || '47291';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${port}/`,
  tracesSampleRate: 1.0,
  release: 'b06',
  environment: 'probe',
});
