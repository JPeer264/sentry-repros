import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const entry = process.argv[2] ?? './src/a2.js';
const out = process.argv[3] ?? './dist-esb3/index.js';

await esbuild.build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'esnext',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module'],
  external: ['cloudflare:*'],
  banner: {
    js: 'import { createRequire as __sentryCreateRequire } from "node:module";\nconst require = __sentryCreateRequire("/worker.js");',
  },
  logLevel: 'info',
  plugins: [sentryOrchestrionPlugin({ buildTimeInstrumentation: false })],
});
