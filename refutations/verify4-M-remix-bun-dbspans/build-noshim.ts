import { sentryBunPlugin } from '@sentry/bun/plugin';
const keepExternal = (names: string[]) => ({
  name: 'keep-external',
  setup(build: any) { build.config.external = [...(build.config.external ?? []), ...names]; },
});
const out = await Bun.build({
  entrypoints: ['./server.mjs'], outdir: './dist-noshim', target: 'bun',
  external: ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'],
  plugins: [sentryBunPlugin(), keepExternal(['express'])],
});
console.log('build-noshim success:', out.success, out.logs.slice(0,10));
