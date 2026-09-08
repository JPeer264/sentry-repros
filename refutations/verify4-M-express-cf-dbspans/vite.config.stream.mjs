import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  build: { outDir: 'dist-stream' },
  plugins: [
    cloudflare({ configPath: './wrangler.stream.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.stream.jsonc' }),
  ],
});
