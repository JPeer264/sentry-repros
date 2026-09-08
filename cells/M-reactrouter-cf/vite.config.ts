import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), reactRouter(), sentryCloudflareVitePlugin()],
});
