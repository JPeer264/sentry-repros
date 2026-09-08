import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

// Keep the SDK and every DB driver out of the Fresh SSR bundle: they are bundled
// (and orchestrion-instrumented) by build-worker3.mjs together with the Worker entry.
export default defineConfig({
  plugins: [fresh()],
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          external: ["@sentry/cloudflare", "mysql", "mysql2", "mysql2/promise"],
        },
      },
    },
  },
});
