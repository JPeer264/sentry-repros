import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'dist-control' },
  plugins: [cloudflare(), sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })],
});
