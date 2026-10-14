import { defineCloudflareOptions } from '@sentry/cloudflare';

export default defineCloudflareOptions((env: { SENTRY_DSN?: string }) => ({
  dsn: env.SENTRY_DSN || 'https://public@example.com/1',
  tracesSampleRate: 1.0,
  beforeSendSpan(span) {
    if (!env.SENTRY_DSN) {
      console.log('[span]', span.attributes['sentry.op'], span.name);
    }
    return span;
  },
}));
