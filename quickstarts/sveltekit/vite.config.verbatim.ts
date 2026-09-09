// getting-started-complete/javascript.sveltekit.mdx:363-372 verbatim (the page's import path).
import { sveltekit } from "@sveltejs/kit/vite";
import { sentrySvelteKit } from "@sentry/sveltekit";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sentrySvelteKit(), sveltekit()],
  // ... rest of your Vite config
});
