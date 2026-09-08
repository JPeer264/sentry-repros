import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// devE: the same non-default wrangler config, but the Sentry plugin is NOT told
// about it, so it falls back to the root wrangler.jsonc.
export default defineConfig({
  plugins: [cloudflare({ configPath: './wrangler.agent.jsonc' }), sentryCloudflareVitePlugin()],
});
