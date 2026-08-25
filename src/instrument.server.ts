import { defineCloudflareOptions } from '@sentry/cloudflare';

export default defineCloudflareOptions(env => ({
  dsn: env.SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT,
  tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE),
  cacheClient: env.CACHE_CLIENT !== 'false',
  enableRpcTracePropagation: env.RPC_TRACE_PROPAGATION !== 'false',
  debug: env.SENTRY_DEBUG === 'true',
}));
