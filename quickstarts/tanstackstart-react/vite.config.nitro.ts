// manual-setup/index.mdx:233-249 plus the `nitro()` plugin the page's `.output/server/index.mjs`
// start command implies (index.mdx:322, 331, 358). Selected with `vite build --config vite.config.nitro.ts`.
import { defineConfig } from "vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro(),
    // other plugins - sentryTanstackStart should be last
    sentryTanstackStart({
      org: "___ORG_SLUG___",
      project: "___PROJECT_SLUG___",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
