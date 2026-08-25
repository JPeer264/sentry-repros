// Picked up by `sentryCloudflareVitePlugin()` by name (next to the worker entry) and used as the
// options callback for every wrapper it injects.
export default (env: Env) => ({
  dsn: env.SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
  cacheClient: env.CACHE_CLIENT !== 'false',
  enableRpcTracePropagation: true,
});
