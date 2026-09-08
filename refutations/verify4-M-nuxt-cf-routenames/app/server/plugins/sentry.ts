import { defineNitroPlugin } from '#imports';
import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins';

export default defineNitroPlugin(
  sentryCloudflareNitroPlugin({
    dsn: 'https://public@dsn.ingest.sentry.io/1337',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    tunnel: 'http://127.0.0.1:41777/',
  }),
);
