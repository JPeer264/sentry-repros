// docs/platforms/javascript/guides/react/index.mdx:242-264 ("Set Up Routing"), plus
// `tracesSampleRate: 1.0` from features/react-router/v7.mdx:54. Added: tunnel, debug, window.Sentry.
import React from "react";
import * as Sentry from "@sentry/react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
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
