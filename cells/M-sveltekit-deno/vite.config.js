import { sentrySvelteKit } from '@sentry/sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default {
  plugins: [sentrySvelteKit({ autoUploadSourceMaps: false }), sveltekit()],
  ssr: { external: ['mysql2', '@sentry/sveltekit', '@sentry/node', '@sentry/core'] },
  build: { rollupOptions: { external: [/^mysql2/, /^@sentry\//] } },
};
