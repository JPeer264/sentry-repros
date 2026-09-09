// SolidStart 2 (what `npm install @solidjs/start` gives today) has no app.config.ts: the build is
// configured here. `sentrySolidStart` comes from the develop-only `@sentry/solidstart/vite` subpath
// (build/types/vite/sentrySolidStart.d.ts); no docs page prints it. The page's own config
// (index.mdx:214-231) is kept verbatim in ./app.config.ts and exercised by check-config.mjs.
import { sentrySolidStart } from '@sentry/solidstart/vite';
import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solidStart({
      appRoot: './src',
      // index.mdx:222, the page passes this to withSentry() in app.config.ts
      middleware: './src/middleware.ts',
    }),
    sentrySolidStart({
      // index.mdx:345-348 would add org/project/authToken here; no auth token in this repro
      debug: true,
    }),
    nitro(),
  ],
});
