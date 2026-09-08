import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig((config) => ({
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          input: "./server/app.ts",
        },
      },
    },
  },
  plugins: [tailwindcss(), reactRouter(), sentryReactRouter({ sourcemaps: { disable: true } }, config)],
  resolve: {
    tsconfigPaths: true,
  },
}));
