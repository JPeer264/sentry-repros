// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sentry from '@sentry/astro';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [sentry()],
});
