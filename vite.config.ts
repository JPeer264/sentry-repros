import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
    sentryTanstackStart({
      // Logs each middleware array that the plugin wraps.
      debug: true,
      // Both Sentry plugins inject the orchestrion snippet, and two copies make the build fail.
      buildTimeInstrumentation: false,
    }),
    sentryCloudflareVitePlugin(),
  ],
});
