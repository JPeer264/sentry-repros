import { sentryBunPlugin } from '@sentry/bun/plugin';
// Negative control for build-final2: same entry, but express is left to the plugin (bundled+transformed).
const out = await Bun.build({
  entrypoints: ['./server-final2.mjs'], outdir: './dist-final3', target: 'bun',
  external: ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'],
  plugins: [sentryBunPlugin()],
});
console.log('build-final3 success:', out.success, out.logs.slice(0,10));
