import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

// The registration snippet the orchestrion transform splices into CJS files of
// node_modules emits `require('@sentry/server-utils')`. esbuild then resolves
// that package through its `require` condition, and its CJS build's
// `require('node:async_hooks')` becomes a dynamic require workerd rejects.
// Aliasing to the ESM build keeps the node builtin a static import.
const alias = {
  '@sentry/server-utils': './node_modules/@sentry/server-utils/build/esm/index.js',
};

const result = await esbuild.build({
  entryPoints: ['./src/index.mjs'],
  outfile: './dist-esbuild2/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  alias,
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
