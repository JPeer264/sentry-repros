import { sentrySolidStart } from '@sentry/solidstart/vite';
import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solidStart({ appRoot: './src', middleware: './src/middleware.ts' }),
    sentrySolidStart({ sourcemaps: { disable: true } }),
    nitro({ serverDir: './server' }),
  ],
});
