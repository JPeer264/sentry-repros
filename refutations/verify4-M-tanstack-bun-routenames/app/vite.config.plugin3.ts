import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';

export default defineConfig({
  build: { rollupOptions: { external: [/^@sentry\//, /^@opentelemetry\//] } },
  plugins: [tsConfigPaths(), tanstackStart(), nitro(), viteReact(), sentryTanstackStart({ sourceMapsUploadOptions: { enabled: false } })],
});
