import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// devC: keep entry/class wrapping, opt out of build-time channel injection.
export default defineConfig({
  plugins: [cloudflare(), sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })],
});
