import * as esbuild from 'esbuild';
import path from 'node:path';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

// esbuild turns every `require()` left in a bundled CJS file into `__require()`,
// which throws on workerd. Both the orchestrion channel import
// (`require('diagnostics_channel')`) and the injected snippet's
// `require('@sentry/server-utils')` land there. Give `__require` a real
// implementation backed by static imports of the builtins workerd provides.
const banner = `
import * as __nodeAsyncHooks from 'node:async_hooks';
import * as __nodeDiagnosticsChannel from 'node:diagnostics_channel';
const __nodeBuiltins = {
  async_hooks: __nodeAsyncHooks,
  'node:async_hooks': __nodeAsyncHooks,
  diagnostics_channel: __nodeDiagnosticsChannel,
  'node:diagnostics_channel': __nodeDiagnosticsChannel,
};
globalThis.require = id => {
  const mod = __nodeBuiltins[id];
  if (!mod) throw new Error('unsupported require: ' + id);
  return mod.default ?? mod;
};
`;

const forceEsmServerUtils = {
  name: 'force-esm-server-utils',
  setup(build) {
    build.onResolve({ filter: /^@sentry\/server-utils$/ }, () => ({
      path: path.resolve('./node_modules/@sentry/server-utils/build/esm/index.js'),
    }));
  },
};

const result = await esbuild.build({
  entryPoints: ['./src/index.mjs'],
  outfile: './dist-esbuild4/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  banner: { js: banner },
  plugins: [forceEsmServerUtils, sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
