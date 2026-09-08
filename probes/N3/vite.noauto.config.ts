import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// devB: opt out of entry/class wrapping, keep build-time channel injection.
export default defineConfig({
  plugins: [cloudflare(), sentryCloudflareVitePlugin({ autoInstrumentation: false })],
});
