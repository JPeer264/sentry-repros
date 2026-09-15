export default (env: Env) => ({
  dsn: env.SENTRY_DSN,
  environment: env.REPRO_ENV,
  tracesSampleRate: 1.0,
  debug: env.SENTRY_DEBUG === '1',
});
