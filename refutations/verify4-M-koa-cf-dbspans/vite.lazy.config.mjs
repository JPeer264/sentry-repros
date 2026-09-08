import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'dist-lazy' },
  plugins: [cloudflare({ configPath: './wrangler.lazy.jsonc' }), sentryCloudflareVitePlugin({ autoInstrumentation: false })],
});
