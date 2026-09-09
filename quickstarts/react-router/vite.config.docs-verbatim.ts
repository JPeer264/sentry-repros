// manual-setup.mdx:453-473 verbatim (org/project placeholders filled, no auth token is ever set).
import { reactRouter } from '@react-router/dev/vite';
import { sentryReactRouter, type SentryReactRouterBuildOptions } from '@sentry/react-router';
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
