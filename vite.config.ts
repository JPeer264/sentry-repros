import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: 'example-org',
      project: 'example-project',
    }),
  ],
});
