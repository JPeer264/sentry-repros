import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  build: { outDir: 'dist-top' },
  plugins: [cloudflare({ configPath: './wrangler.top.jsonc' }), sentryCloudflareVitePlugin()],
});
