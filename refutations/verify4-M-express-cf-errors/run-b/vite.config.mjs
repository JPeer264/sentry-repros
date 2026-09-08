import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  build: { outDir: 'dist-vite' },
  plugins: [
    cloudflare({ configPath: './wrangler.vite.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.vite.jsonc' }),
  ],
});
