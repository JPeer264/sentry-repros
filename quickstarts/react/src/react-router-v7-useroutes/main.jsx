// features/react-router/v7.mdx:122-160 ("Usage With useRoutes Hook") verbatim, plus tunnel, debug
// and a `window.__snippetError` probe. Nothing else is imported on purpose: the snippet uses
// `Sentry`, `wrapUseRoutesV7`, `ReactDOM` and `BrowserRouter` without importing them.
import React from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
  useRoutes,
} from "react-router";

import { wrapUseRoutes } from "@sentry/react";

try {
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

const useSentryRoutes = wrapUseRoutesV7(useRoutes);

function App() {
  return useSentryRoutes([
    // your routes...
  ]);
}

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);
} catch (e) {
  window.__snippetError = String(e);
  document.body.setAttribute("data-snippet-error", String(e));
}
