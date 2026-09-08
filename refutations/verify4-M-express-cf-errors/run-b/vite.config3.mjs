import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  build: { outDir: 'dist-vite3' },
  plugins: [
    cloudflare({ configPath: './wrangler.vite3.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.vite3.jsonc' }),
  ],
});
