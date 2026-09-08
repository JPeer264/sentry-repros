import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sentrySvelteKit } from '@sentry/sveltekit/vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({ autoUploadSourceMaps: false, adapter: 'node' }),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }: { filename: string }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			experimental: {
				instrumentation: { server: true },
				tracing: { server: true }
			}
		})
	]
});
