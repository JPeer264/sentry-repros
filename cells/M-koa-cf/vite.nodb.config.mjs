import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default defineConfig({
  plugins: [cloudflare({ configPath: './wrangler.nodb.jsonc' }), sentryCloudflareVitePlugin({ autoInstrumentation: false })],
  ssr: { noExternal: true },
});
