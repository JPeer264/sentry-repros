// getting-started-complete/javascript.sveltekit.mdx:363-372 with the import path changed to the
// `@sentry/sveltekit/vite` subpath, the only place develop exports `sentrySvelteKit` from
// (v10-to-v11/index.mdx:1245-1252). The page's own import is in vite.config.verbatim.ts.
import { sveltekit } from "@sveltejs/kit/vite";
import { sentrySvelteKit } from "@sentry/sveltekit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sentrySvelteKit(), sveltekit()],
  // ... rest of your Vite config
});
