import { sentrySolidStart } from '@sentry/solidstart/vite';
import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solidStart({ appRoot: './src' }),
    sentrySolidStart({ sourcemaps: { disable: true }, debug: true }),
    nitro({ serverDir: './server' }),
  ],
});
