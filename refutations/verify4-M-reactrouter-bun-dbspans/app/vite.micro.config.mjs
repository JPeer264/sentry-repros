import { defineConfig } from 'vite';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/vite';

export default defineConfig({
  build: {
    ssr: 'micro/entry.mjs',
    outDir: 'micro-dist',
    target: 'node22',
    minify: false,
  },
  plugins: [sentryOrchestrionPlugin()],
});
