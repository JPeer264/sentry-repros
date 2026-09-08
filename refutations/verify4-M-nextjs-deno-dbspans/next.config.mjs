import sentryConfigModule from '@sentry/nextjs/config';
const { withSentryConfig } = sentryConfigModule;

const bundleMysql = process.env.BUNDLE_MYSQL === '1';

// Variant experiment: undo Next's externalization of `mysql` so the orchestrion build-time loader
// can transform it. `serverExternalPackages` cannot express this, Sentry always appends its own
// defaults, so the externals functions Next installed are wrapped here instead.
const nextConfig = bundleMysql
  ? {
      distDir: '.next-bundlemysql',
      webpack: (config, { isServer }) => {
        if (isServer && Array.isArray(config.externals)) {
          config.externals = config.externals.map(entry =>
            typeof entry === 'function'
              ? function (ctx, cb) {
                  const request = typeof ctx === 'object' ? ctx.request : cb;
                  if (request === 'mysql' || (typeof request === 'string' && request.startsWith('mysql/'))) {
                    return typeof cb === 'function' ? cb() : Promise.resolve(undefined);
                  }
                  return entry.call(this, ctx, cb);
                }
              : entry,
          );
        }
        return config;
      },
    }
  : {};

export default withSentryConfig(nextConfig, {
  silent: false,
  sourcemaps: { disable: true },
  telemetry: false,
  debug: true,
});
