import { defineConfig } from 'astro/config';
import deno from '@deno/astro-adapter';
import sentry from '@sentry/astro';

export default defineConfig({
  output: 'server',
  adapter: deno({ port: 47313, hostname: '127.0.0.1' }),
  integrations: [sentry({ enabled: { client: false, server: true }, sourcemaps: { disable: true } })],
});
