import { sentryBunPlugin } from '@sentry/bun/plugin';

const entry = process.env.BUNDLE_ENTRY || './server-a.mjs';
const out = process.env.BUNDLE_OUT || './dist-a';

const result = await Bun.build({
  entrypoints: [entry],
  outdir: out,
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
console.log('build success', result.success, result.outputs.map(o => o.path));
