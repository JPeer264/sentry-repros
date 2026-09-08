import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'dist' },
  plugins: [cloudflare({ configPath: './wrangler.jsonc' }), sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.jsonc' })],
});
