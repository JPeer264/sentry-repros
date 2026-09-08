import { sentryBunPlugin } from '@sentry/bun/plugin';

// Compiled binaries are ~67 MB each, so they are written under node_modules to
// keep the checked-in folder small; `rm -rf node_modules` cleans them up.
const result = await Bun.build({
  entrypoints: ['./app.ts'],
  target: 'bun',
  compile: { outfile: './node_modules/.b11-bin/app-plugin' },
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
console.log('build.ts success=%s', result.success);
