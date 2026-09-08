import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['./server.mjs'],
  outfile: './dist-server/server.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['@sentry/*', 'mysql2', 'react', 'react-dom', 'react-dom/server'],
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('bundled');
