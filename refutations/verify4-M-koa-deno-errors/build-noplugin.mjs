import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['./main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: 'dist-noplugin/main.js',
  external: ['@sentry/deno', '@sentry/server-utils'],
  banner: {
    js: "import { createRequire as __sentryCreateRequire } from 'node:module';\nconst require = __sentryCreateRequire(import.meta.url);",
  },
  plugins: [sentryOrchestrionPlugin({ buildTimeInstrumentation: false })],
  logLevel: 'info',
});
