import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['./server-lazy.mjs'],
  outfile: './dist-lazy/server.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['@sentry/*', 'mysql2', 'mysql2/promise', 'react', 'react-dom', 'react-dom/server'],
  banner: { js: "import { createRequire as __sentryCreateRequire } from 'node:module';\nconst require = __sentryCreateRequire(import.meta.url);" },
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('bundled');
