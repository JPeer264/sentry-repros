import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'distb' },
  plugins: [cloudflare({ configPath: './wrangler.b.jsonc' }), sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.b.jsonc' })],
});
