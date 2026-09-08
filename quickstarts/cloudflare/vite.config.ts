import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// `wrangler-vite.jsonc` is a non-default config name so that this variant can live next to the
// wrangler variants in one directory. Both plugins have to be told about it: `@cloudflare/vite-plugin`
// via `configPath`, the Sentry plugin via `wranglerConfigPath`. With a plain `wrangler.jsonc` both
// options are unnecessary and the quick start's bare `sentryCloudflareVitePlugin()` is enough.
export default defineConfig({
  plugins: [
    cloudflare({ configPath: './wrangler-vite.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler-vite.jsonc' }),
  ],
});
