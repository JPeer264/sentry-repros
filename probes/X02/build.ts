import { sentryBunPlugin } from '@sentry/bun/plugin';

const outdir = process.env.OUTDIR ?? './dist';

const result = await Bun.build({
  entrypoints: [
    './app-modscope.ts',
    './app-inreq.ts',
    './app-lazy.ts',
    './app-nosdk-lazy.ts',
    './app-nosdk-modscope.ts',
  ],
  outdir,
  target: 'bun',
  external: ['@sentry/*'],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});

console.log(outdir, result.success, result.outputs.map(o => o.path).join('\n'));
