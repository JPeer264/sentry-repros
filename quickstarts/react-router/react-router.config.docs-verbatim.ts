// manual-setup.mdx:507-519 verbatim, including the `+(await ...)` line as the page prints it.
// The page imports `sentryOnBuildEnd` from "@sentry/react-router"; see README for what happens.
import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  ssr: true,
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    // ...
    // Call this at the end of the hook
    +(await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest }));
  },
} satisfies Config;
