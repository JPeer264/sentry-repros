import { sentryVitePlugin } from '@sentry/node/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sentryVitePlugin({ sourcemaps: { disable: true }, telemetry: false })],
});
