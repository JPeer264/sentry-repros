// manual-setup/index.mdx:233-249 verbatim (the docs vite.config.ts, no Nitro plugin, no React plugin).
import { defineConfig } from "vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    // other plugins - sentryTanstackStart should be last
    sentryTanstackStart({
      org: "___ORG_SLUG___",
      project: "___PROJECT_SLUG___",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
