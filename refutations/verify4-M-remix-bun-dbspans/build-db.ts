import { sentryBunPlugin } from '@sentry/bun/plugin';

const out = await Bun.build({
  entrypoints: ['./db.mjs'],
  outdir: './dist-db',
  target: 'bun',
  external: [
    '@sentry/remix',
    '@sentry/node',
    '@sentry/core',
    '@sentry/bun',
    '@sentry/server-utils',
    '@sentry/opentelemetry',
    '@sentry/server-runtime-injection',
  ],
  plugins: [sentryBunPlugin()],
});
console.log('build-db success:', out.success, out.logs.slice(0, 10));
