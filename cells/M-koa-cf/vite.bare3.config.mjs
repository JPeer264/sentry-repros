import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
export default defineConfig({ plugins: [cloudflare({ configPath: './wrangler.bare2.jsonc' }), sentryCloudflareVitePlugin({ autoInstrumentation: false })] });
