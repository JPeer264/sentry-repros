import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// devD: a non-default wrangler config name. `cloudflare()` is told about it via
// `configPath`, the Sentry plugin via `wranglerConfigPath`.
export default defineConfig({
  plugins: [
    cloudflare({ configPath: './wrangler.agent.jsonc' }),
    sentryCloudflareVitePlugin({ wranglerConfigPath: './wrangler.agent.jsonc' }),
  ],
});
