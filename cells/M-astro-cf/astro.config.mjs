import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sentry from '@sentry/astro';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [sentry({ sourcemaps: { disable: true } })],
});
