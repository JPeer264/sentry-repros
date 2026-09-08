// features/react-router/v8.mdx:35-58 (version-agnostic APIs), built against react-router@8.
// Added: tunnel, debug, window.Sentry.
import React from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  integrations: [
    Sentry.reactRouterBrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: 1.0,
});

window.Sentry = Sentry;
