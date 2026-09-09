// docs: platform-includes/getting-started-complete/javascript.remix.mdx:109-139 (withSentry) and :82-92
// (ErrorBoundary with captureRemixErrorBoundaryError), copied verbatim. The docs ErrorBoundary snippet
// calls `useRouteError()` without importing it and returns `<div> ... </div>`; the import is added here and
// the placeholder body renders a full document so the boundary can be served for document requests too.
// The root `loader` is repro-only: it gives the SDK a root loader to attach `sentryTrace`/`sentryBaggage` to.
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";

import { captureRemixErrorBoundaryError, withSentry } from "@sentry/remix";

export const loader = () => json({ ok: true });

export const ErrorBoundary = () => {
  const error = useRouteError();

  captureRemixErrorBoundaryError(error);

  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root-error-boundary">{error instanceof Error ? error.message : JSON.stringify(error)}</div>
        <Scripts />
      </body>
    </html>
  );
};

function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default withSentry(App);
