// features/react-router/v7.mdx:71-108 ("Usage With <Routes /> Component") verbatim, plus tunnel,
// debug and the driver hooks. `ReactDOM.render` is called exactly as the page prints it.
import React from "react";
import ReactDOM from "react-dom";
import {
  Routes,
  Route,
  BrowserRouter,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router";

import * as Sentry from "@sentry/react";
import { installHarness } from "../shared/harness";

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
window.__reactVersion = React.version;
window.__reactDomRenderType = typeof ReactDOM.render;
installHarness();

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

ReactDOM.render(
  <BrowserRouter>
    <SentryRoutes>
      <Route path="/" element={<div>Home</div>} />
    </SentryRoutes>
  </BrowserRouter>
);
