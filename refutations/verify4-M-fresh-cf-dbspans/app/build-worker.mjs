import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const result = await esbuild.build({
  entryPoints: ['worker.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  outfile: 'dist/worker.mjs',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module', 'default'],
  logLevel: 'info',
  plugins: [sentryOrchestrionPlugin()],
});
console.log('warnings', result.warnings.length);
