import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  build: { outDir: 'dist-vite2' },
  plugins: [
    cloudflare({ configPath: './wrangler.vite2.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.vite2.jsonc' }),
  ],
});
