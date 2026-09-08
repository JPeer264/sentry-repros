import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';

// sentryTanstackStart() is deliberately absent: adding it fails the SSR build
// with `"default" is not exported by node_modules/@sentry/conventions/dist/attributes.mjs`.
export default defineConfig({
  plugins: [tsConfigPaths(), tanstackStart(), nitro(), viteReact()],
});
