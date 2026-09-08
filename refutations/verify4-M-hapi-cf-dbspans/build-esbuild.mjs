import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const result = await esbuild.build({
  entryPoints: ['./src/index.mjs'],
  outfile: './dist-esbuild/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
