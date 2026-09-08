import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tsConfigPaths(),
    tanstackStart(),
    sentryTanstackStart({ sourcemaps: { disable: true } }),
    viteReact(),
  ],
});
