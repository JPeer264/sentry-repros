import * as esbuild from 'esbuild';
import { builtinModules } from 'node:module';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const builtins = new Set(builtinModules.filter(m => !m.startsWith('_')));

// workerd only exposes node builtins under the `node:` specifier, and esbuild's
// ESM output turns a bare CJS `require('tty')` into a throwing shim, so rewrite
// every bare builtin to its `node:` form and leave it external.
const nodePrefix = {
  name: 'node-prefix',
  setup(build) {
    build.onResolve({ filter: /.*/ }, args => {
      if (builtins.has(args.path)) return { path: `node:${args.path}`, external: true };
      return null;
    });
  },
};

await esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist-esbuild2/index.js',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'esnext',
  conditions: ['workerd', 'worker', 'node', 'import', 'module', 'default'],
  external: ['cloudflare:*', 'node:*'],
  plugins: [nodePrefix, sentryOrchestrionPlugin()],
  logLevel: 'info',
});
