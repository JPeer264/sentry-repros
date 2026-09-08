import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

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
