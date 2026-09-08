import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [fresh()],
  // the mysql driver must be loaded by Deno's loader so the Sentry import hook can transform it
  ssr: { external: ["mysql"] },
});
