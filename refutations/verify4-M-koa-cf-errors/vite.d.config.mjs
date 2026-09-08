import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';

export default {
  plugins: [cloudflare({ configPath: './wrangler.d.jsonc' }), sentryCloudflareVitePlugin()],
  build: { minify: false, outDir: 'dist-d' },
};
