import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'distB2' },
  plugins: [
    cloudflare({ configPath: './wrangler.B2.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.B2.jsonc' }),
  ],
});
