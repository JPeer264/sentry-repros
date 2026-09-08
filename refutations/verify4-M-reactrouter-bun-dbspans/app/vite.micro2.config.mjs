import { defineConfig } from 'vite';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/vite';

export default defineConfig({
  build: { ssr: 'micro/entry.mjs', outDir: 'micro-dist2', target: 'node22', minify: false },
  plugins: [
    {
      name: 'probe',
      transform(code, id, opts) {
        if (id.includes('mysql2')) {
          console.log('PROBE transform', id.split('node_modules/').pop(), 'opts=', JSON.stringify(opts), 'env=', this.environment?.name, this.environment?.config?.consumer);
        }
        return null;
      },
    },
    sentryOrchestrionPlugin(),
  ],
});
