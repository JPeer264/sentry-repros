import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'dist-ns' }, plugins: [cloudflare()] });
