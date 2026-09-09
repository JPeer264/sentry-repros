// manual-setup.mdx:507-519 with one change: `sentryOnBuildEnd` is imported from
// "@sentry/react-router/vite" (the root export has none on develop, see
// react-router.config.docs-verbatim.ts and README). The `+(await ...)` line is kept as the page prints it.
import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router/vite";

export default {
  ssr: true,
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    // ...
    // Call this at the end of the hook
    +(await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest }));
  },
} satisfies Config;
