import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const entry = process.argv[2] ?? './src/eager.mjs';
const out = process.argv[3] ?? './dist-esbuild/worker.mjs';

const result = await esbuild.build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
