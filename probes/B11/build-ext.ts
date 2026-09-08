import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./app.ts'],
  target: 'bun',
  compile: { outfile: './node_modules/.b11-bin/app-plugin-ext' },
  sourcemap: 'external',
  external: ['@sentry/*'],
  plugins: [sentryBunPlugin()],
});
console.log('build-ext.ts success=%s', result.success);
