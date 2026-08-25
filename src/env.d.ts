interface Env {
  REPRO_DO: DurableObjectNamespace<import('./index').ReproDO>;
  SENTRY_DSN?: string;
  /** Sentry `environment` tag. The scripts set one per run so runs can be validated in isolation. */
  SENTRY_ENVIRONMENT?: string;
  /** "false" turns the `cacheClient` option off (one client per invocation). Default: on. */
  CACHE_CLIENT?: string;
}
