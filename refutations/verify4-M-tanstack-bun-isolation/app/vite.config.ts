import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';

const sentryExternal = [/^@sentry\//, '@opentelemetry/api'];

export default defineConfig({
  ssr: { external: ['@sentry/tanstackstart-react', '@sentry/node', '@sentry/core', '@sentry/server-utils', '@sentry/server-runtime-injection', '@sentry/opentelemetry', '@sentry/conventions'] },
  builder: {},
  environments: {
    ssr: { build: { rollupOptions: { external: sentryExternal } } },
    nitro: { build: { rollupOptions: { external: sentryExternal } } },
  },
  plugins: [tsConfigPaths(), tanstackStart(), nitro(), viteReact()],
});
