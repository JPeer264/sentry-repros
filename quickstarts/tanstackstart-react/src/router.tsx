// manual-setup/index.mdx:164-180: the diff's `+` lines applied. The diff's `createRouter()` takes no
// arguments; a TanStack Start app needs `createRouter({ routeTree })`, so that is the one deviation.
import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({ routeTree });

  if (!router.isServer) {
    Sentry.addIntegration(
      Sentry.tanstackRouterBrowserTracingIntegration(router)
    );
  }

  return router;
}
