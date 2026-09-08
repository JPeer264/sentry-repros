import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['./main.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: 'dist-cjs/main.cjs',
  external: ['@sentry/deno', '@sentry/server-utils'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
