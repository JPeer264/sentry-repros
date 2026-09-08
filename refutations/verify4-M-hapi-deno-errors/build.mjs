import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

await esbuild.build({
  entryPoints: ['./main-nohook.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: 'dist/main.js',
  external: ['@sentry/deno', '@sentry/server-utils'],
  loader: { '.json': 'json' },
  banner: {
    js: "import { createRequire as __sentryCreateRequire } from 'node:module';\nconst require = __sentryCreateRequire(import.meta.url);",
  },
  plugins: [sentryOrchestrionPlugin()],
  logLevel: 'info',
});
