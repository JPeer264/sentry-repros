import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['worker.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  outfile: 'dist4/worker.mjs',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module', 'default'],
  logLevel: 'silent',
  banner: {
    js: 'import { createRequire as __sentryCr } from "node:module";\nglobalThis.require = __sentryCr("file:///worker.mjs");',
  },
  plugins: [sentryOrchestrionPlugin()],
});
console.log('built');
