import { vitePlugin as remix } from '@remix-run/dev';
import { sentryRemixVitePlugin } from '@sentry/remix';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [remix(), sentryRemixVitePlugin()],
});
