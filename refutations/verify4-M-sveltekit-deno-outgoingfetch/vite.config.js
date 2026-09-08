import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit/vite';
export default {
  plugins: [sentrySvelteKit({ autoUploadSourceMaps: false }), sveltekit()],
  ssr: { external: ['@sentry/sveltekit', '@sentry/node', '@sentry/core', '@sentry/cloudflare'] },
  build: { rollupOptions: { external: [/^@sentry\//] } },
};
