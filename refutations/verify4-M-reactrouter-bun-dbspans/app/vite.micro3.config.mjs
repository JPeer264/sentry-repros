import { defineConfig } from 'vite';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/vite';
export default defineConfig({
  build: { ssr: 'micro/entry2.mjs', outDir: 'micro-dist3', target: 'node22', minify: false },
  plugins: [sentryOrchestrionPlugin()],
});
