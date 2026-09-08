import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const config = {
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          input: "./server/app.ts",
        },
      },
    },
  },
  ssr: {
    // so the Sentry orchestrion plugin can transform the driver during the SSR build
    noExternal: ["mysql2"],
  },
  resolve: {
    tsconfigPaths: true,
  },
};

export default defineConfig(c => ({
  ...config,
  plugins: [
    tailwindcss(),
    reactRouter(),
    sentryReactRouter({ sourcemaps: { disable: true } }, c),
  ],
}));
