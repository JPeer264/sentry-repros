import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  ssr: { external: ["@sentry/bun", "mysql2", "mysql2/promise"] },
  build: {
    rollupOptions: { external: [/^@sentry\//, /^mysql2/] },
  },
});
