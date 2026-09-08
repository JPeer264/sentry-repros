import { cloudflare } from '@cloudflare/vite-plugin';
export default {
  plugins: [cloudflare({ configPath: './wrangler.e.jsonc' })],
  build: { minify: false, outDir: 'dist-e' },
};
