import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist-esbuild/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'esnext',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module', 'default'],
  external: ['cloudflare:*', 'node:*'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
