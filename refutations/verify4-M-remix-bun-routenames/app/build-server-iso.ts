import { sentryBunPlugin } from '@sentry/bun/plugin';

const out = await Bun.build({
  entrypoints: ['./server-iso.mjs'],
  outdir: './dist-iso',
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
if (!out.success) {
  console.error(out.logs);
  process.exit(1);
}
console.log('built', out.outputs.map(o => o.path));
