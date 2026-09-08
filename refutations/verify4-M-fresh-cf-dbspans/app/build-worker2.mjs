import * as esbuild from 'esbuild';
import { builtinModules } from 'node:module';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const BUILTINS = new Set(builtinModules.filter(m => !m.startsWith('node:')));

// wrangler's own bundler resolves `node:*` under nodejs_compat, but esbuild turns a
// CJS `require('net')` into its `__require` stub that throws at runtime. Route every
// bare builtin request through a generated ESM shim so the require becomes a real
// static import of the `node:` specifier instead.
const nodeBuiltinEsmShim = {
  name: 'node-builtin-esm-shim',
  setup(build) {
    build.onResolve({ filter: /^(node:)?[a-z_/]+$/ }, args => {
      if (args.path.startsWith('node:')) return { path: args.path, external: true };
      if (!BUILTINS.has(args.path)) return null;
      return { path: args.path, namespace: 'nbshim' };
    });
    build.onLoad({ filter: /.*/, namespace: 'nbshim' }, args => ({
      contents: [
        `import * as m from ${JSON.stringify('node:' + args.path)};`,
        `export * from ${JSON.stringify('node:' + args.path)};`,
        'export default (m.default !== undefined ? m.default : m);',
      ].join('\n'),
      loader: 'js',
    }));
  },
};

const result = await esbuild.build({
  entryPoints: ['worker.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'es2022',
  outfile: 'dist2/worker.mjs',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module', 'default'],
  logLevel: 'warning',
  plugins: [nodeBuiltinEsmShim, sentryOrchestrionPlugin()],
});
console.log('warnings', result.warnings.length);
