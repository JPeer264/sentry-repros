// Position probe: sentryTanstackStart() before tanstackStart(), against index.mdx:241 "sentryTanstackStart should be last".
import { defineConfig } from "vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    sentryTanstackStart({
      org: "___ORG_SLUG___",
      project: "___PROJECT_SLUG___",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    tanstackStart(),
    nitro(),
  ],
});
