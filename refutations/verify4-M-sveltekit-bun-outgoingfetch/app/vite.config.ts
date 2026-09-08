import { sentrySvelteKit } from '@sentry/sveltekit/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			autoUploadSourceMaps: false,
			adapter: 'node'
		}),
		sveltekit({
			adapter: adapter(),
			experimental: {
				instrumentation: { server: true },
				tracing: { server: true }
			}
		})
	]
});
