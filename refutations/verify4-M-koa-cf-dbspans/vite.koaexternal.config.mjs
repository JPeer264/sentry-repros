import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'dist-koaexternal' },
  ssr: { external: ['koa'] },
  plugins: [cloudflare({ configPath: './wrangler.jsonc' }), sentryCloudflareVitePlugin({ autoInstrumentation: false })],
});
