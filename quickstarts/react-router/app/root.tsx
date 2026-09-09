// The `create-react-router` basic template's root.tsx (Layout, App, ErrorBoundary), which is what a
// new user has when they reach the guide. The guide itself shows no root.tsx snippet. Repro-only
// additions: the nav links and the ids/data attributes the driver reads.
import { useEffect } from "react";
import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav>
          <Link id="nav-home" to="/">home</Link>{" "}
          <Link id="nav-user" to="/users/7">user 7</Link>{" "}
          <Link id="nav-error" to="/error">loader error</Link>{" "}
          <Link id="nav-error-tracing" to="/error-tracing">loader error (tracing)</Link>{" "}
          <Link id="nav-action" to="/action-error">action error</Link>
        </nav>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    document.body.setAttribute("data-wired", "1");
  }, []);
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main id="root-error-boundary" data-message={message} data-details={details}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
