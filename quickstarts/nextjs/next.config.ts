import type { NextConfig } from "next";
// Docs (index.mdx:91) import from "@sentry/nextjs": on develop that is not a function, see build-app-router-docs-import.log
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Your existing Next.js configuration
};

export default withSentryConfig(nextConfig, {
  org: "___ORG_SLUG___",
  project: "___PROJECT_SLUG___",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Use a fixed route (recommended)
  tunnelRoute: "/sentry-tunnel",
});
