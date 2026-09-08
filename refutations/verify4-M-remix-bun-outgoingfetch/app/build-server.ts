import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./server.mjs'],
  outdir: './dist',
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

console.log('build success:', result.success, result.logs);
