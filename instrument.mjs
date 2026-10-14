import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://public@example.com/1',
  tracesSampleRate: 1.0,
  beforeSendSpan(span) {
    if (!process.env.SENTRY_DSN) {
      console.log('[span]', span.attributes?.['sentry.op']?.value, span.name);
    }
    return span;
  },
});
