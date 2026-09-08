// features/react-router/v8.mdx:60-66 (wrapCreateBrowserRouter) and :222-258 (custom error boundary),
// with the `as Error` cast dropped so the .jsx file parses.
import "./instrument";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet, Link, useParams, useRouteError } from "react-router";
import * as Sentry from "@sentry/react";
import { VerifyButtons } from "../shared/VerifyButtons";
import { installHarness } from "../shared/harness";
import { version } from "react";

installHarness();
window.__reactVersion = version;

export function YourCustomRootErrorBoundary() {
  const error = useRouteError();

  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div id="route-error-boundary">
      <h1>Ouch!</h1>
      <Link id="nav-home" to="/">home</Link>
    </div>
  );
}

function Layout() {
  return (
    <div>
      <h1>QS-react react-router-v8</h1>
      <nav>
        <Link id="nav-home" to="/">home</Link> <Link id="nav-user" to="/users/7">user 7</Link>{" "}
        <Link id="nav-boom" to="/boom">boom</Link>
      </nav>
      <VerifyButtons />
      <Outlet />
    </div>
  );
}

function User() {
  const { userId } = useParams();
  return <p>user <span id="user-id">{userId}</span></p>;
}

function Boom() {
  throw new Error("boom route render error");
}

// Call this AFTER Sentry.init()
const sentryCreateBrowserRouter =
  Sentry.wrapCreateBrowserRouter(createBrowserRouter);

const router = sentryCreateBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Outlet />,
        errorElement: <YourCustomRootErrorBoundary />,
        children: [
          { index: true, element: <p id="home">home</p> },
          { path: "users/:userId", element: <User /> },
          { path: "boom", element: <Boom /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(<RouterProvider router={router} />);
