import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sentry from '@sentry/astro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sentry({ sourcemaps: { disable: true }, enabled: { client: false, server: true } })],
  vite: { ssr: { noExternal: ['mysql2'] } },
});
