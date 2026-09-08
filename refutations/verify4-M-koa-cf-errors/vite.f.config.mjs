import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
export default {
  plugins: [cloudflare({ configPath: './wrangler.f.jsonc' }), sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })],
  build: { minify: false, outDir: 'dist-f' },
};
