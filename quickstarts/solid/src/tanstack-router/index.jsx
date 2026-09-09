// docs/platforms/javascript/guides/solid/features/tanstack-router.mdx:20-44 verbatim (a
// ```javascript fence), saved as index.jsx the way the guide's index.jsx is. Build-only probe:
// @tanstack/solid-router is not installed and no route tree is built, so this variant is "not run".
import * as Sentry from "@sentry/solid";
import { tanstackRouterBrowserTracingIntegration } from '@sentry/solid/tanstackrouter';
import { createRouter } from "@tanstack/solid-router";

const router = createRouter({
  // Your router options...
});

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router;
  }
}

Sentry.init({
  dsn: "___PUBLIC_DSN___",
  integrations: [tanstackRouterBrowserTracingIntegration(router)],

  // Setting a sample rate is required for sending performance data.
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control.
  tracesSampleRate: 1.0,
});
