// manual-setup.mdx:453-473 with one change: the plugin is imported from "@sentry/react-router/vite".
// The root export has no `sentryReactRouter` on develop, see vite.config.docs-verbatim.ts and README.
import { reactRouter } from '@react-router/dev/vite';
import { sentryReactRouter, type SentryReactRouterBuildOptions } from '@sentry/react-router/vite';
import { defineConfig } from 'vite';

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "example-org",
  project: "example-project",

  // An auth token is required for uploading source maps;
  // store it in an environment variable to keep it secure.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // ...
};

export default defineConfig(config => {
  return {
    plugins: [reactRouter(),sentryReactRouter(sentryConfig, config)],
  };
});
