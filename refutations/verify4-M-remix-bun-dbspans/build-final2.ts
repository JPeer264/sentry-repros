import { sentryBunPlugin } from '@sentry/bun/plugin';

// `sentryBunPlugin` un-externalizes every instrumented package. Bundling+transforming `express`
// breaks AsyncLocalStorage propagation across `next()` on Bun, so put it back on `external` after
// the Sentry plugin has run. `mysql2` stays bundled, which is what gets it instrumented.
const keepExternal = (names: string[]) => ({
  name: 'keep-external',
  setup(build: any) {
    build.config.external = [...(build.config.external ?? []), ...names];
  },
});

const out = await Bun.build({
  entrypoints: ['./server-final2.mjs'], outdir: './dist-final2', target: 'bun',
  external: ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'],
  plugins: [sentryBunPlugin(), keepExternal(['express'])],
});
console.log('build-final2 success:', out.success, out.logs.slice(0,10));
