import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'distB' },
  plugins: [
    cloudflare({ configPath: './wrangler.B.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.B.jsonc', autoInstrumentation: false }),
  ],
});
