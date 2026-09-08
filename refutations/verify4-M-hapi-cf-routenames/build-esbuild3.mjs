import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const result = await esbuild.build({
  entryPoints: [process.argv[2] ?? './src/eager.mjs'],
  outfile: process.argv[3] ?? './dist-esbuild3/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  banner: {
    js: "import { createRequire as __sentryCreateRequire } from 'node:module';\nconst require = __sentryCreateRequire('file:///worker.js');",
  },
  plugins: [sentryOrchestrionPlugin({ buildTimeInstrumentation: false })],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
