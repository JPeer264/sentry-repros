import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['./main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: 'dist-nobanner/main.js',
  external: ['@sentry/deno'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
