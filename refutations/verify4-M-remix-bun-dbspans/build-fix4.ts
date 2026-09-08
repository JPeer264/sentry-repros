import { sentryBunPlugin } from '@sentry/bun/plugin';

// sentryBunPlugin strips every instrumented package from `external` so it gets bundled and
// transformed. This second plugin runs after it and puts `express` back, so express is loaded
// from node_modules untransformed.
const keepExternal = (names: string[]) => ({
  name: 'keep-external',
  setup(build: any) {
    build.config.external = [...(build.config.external ?? []), ...names];
  },
});

const out = await Bun.build({
  entrypoints: ['./server-fix3.mjs'], outdir: './dist-fix4', target: 'bun',
  external: ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'],
  plugins: [sentryBunPlugin(), keepExternal(['express'])],
});
console.log('build-fix4 success:', out.success, out.logs.slice(0,10));
