import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  // dev: let Deno's own loader (and the Sentry import hook) load the driver
  ssr: { external: ["mysql"] },
  // build: @fresh/plugin-vite sets resolve.noExternal true, only the rollup
  // external of the ssr environment keeps the driver out of the bundle
  environments: {
    ssr: { build: { rollupOptions: { external: ["mysql"] } } },
  },
});
