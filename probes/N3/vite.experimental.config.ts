import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// The option names the docs page documents. They do not exist on develop.
export default defineConfig({
  plugins: [
    cloudflare(),
    // @ts-expect-error kept to show the compiler rejects the documented names
    sentryCloudflareVitePlugin({ _experimental: { autoInstrumentation: false, useDiagnosticsChannelInjection: false } }),
  ],
});
