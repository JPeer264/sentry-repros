import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'distC' },
  plugins: [
    cloudflare({ configPath: './wrangler.C.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.C.jsonc' }),
  ],
});
