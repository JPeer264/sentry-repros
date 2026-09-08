import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// devA: no options at all. Both autoInstrumentation and buildTimeInstrumentation
// default to true, so this alone wraps the entry, the DO, the Workflow and the
// WorkerEntrypoint, and injects the mysql diagnostics channel.
export default defineConfig({
  plugins: [cloudflare(), sentryCloudflareVitePlugin()],
});
