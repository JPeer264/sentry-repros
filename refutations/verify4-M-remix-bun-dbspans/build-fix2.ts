import { sentryBunPlugin } from '@sentry/bun/plugin';
const out = await Bun.build({
  entrypoints: ['./server-fix2.mjs'],
  outdir: './dist-fix2',
  target: 'bun',
  external: ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'],
  plugins: [sentryBunPlugin()],
});
console.log('build-fix2 success:', out.success, out.logs.slice(0, 10));
