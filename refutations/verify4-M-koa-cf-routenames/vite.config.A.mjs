import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'distA' },
  plugins: [
    cloudflare({ configPath: './wrangler.A.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.A.jsonc', autoInstrumentation: false }),
  ],
});
