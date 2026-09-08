import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const result = await esbuild.build({
  entryPoints: [process.argv[2]],
  outfile: process.argv[3],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  banner: {
    js: "import { createRequire as __sentryCreateRequire } from 'node:module';\nconst require = __sentryCreateRequire('file:///worker.js');",
  },
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'warning',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
