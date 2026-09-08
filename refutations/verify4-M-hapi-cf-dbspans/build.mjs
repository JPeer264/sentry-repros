import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['src/index.mjs'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/worker.mjs',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
