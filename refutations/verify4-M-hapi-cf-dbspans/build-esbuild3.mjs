import * as esbuild from 'esbuild';
import path from 'node:path';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

// The registration snippet the orchestrion transform splices into CJS files of
// node_modules emits `require('@sentry/server-utils')`. esbuild resolves that
// through the package's `require` condition, whose CJS build calls
// `require('node:async_hooks')` - a dynamic require workerd rejects. Pin the
// bare specifier to the ESM build so the node builtin stays a static import.
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
  outfile: './dist-esbuild3/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  plugins: [forceEsmServerUtils, sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
