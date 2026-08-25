import { defineCloudflareOptions } from '@sentry/cloudflare';

export default defineCloudflareOptions((env) => ({
  dsn: env.SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT || 'repro',
  tracesSampleRate: 1.0,
  cacheClient: env.CACHE_CLIENT !== 'false',
  enableRpcTracePropagation: true,
}));
