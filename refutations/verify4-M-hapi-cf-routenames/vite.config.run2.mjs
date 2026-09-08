import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  build: { outDir: 'dist-vite2' },
  plugins: [
    cloudflare({ configPath: './wr2-vite.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wr2-vite.jsonc', autoInstrumentation: false }),
  ],
});
