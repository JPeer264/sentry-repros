import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  build: { outDir: 'dist-nosentry' },
  plugins: [cloudflare({ configPath: './wrangler.nosentry.jsonc' })],
});
