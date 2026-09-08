import { sentryBunPlugin } from '@sentry/bun/plugin';

const res = await Bun.build({
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
if (!res.success) {
  console.error(res.logs);
  process.exit(1);
}
console.log('built ./server.mjs -> ./dist');
