import { useEffect, type ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "QS TanStack Start" }],
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    document.documentElement.setAttribute("data-hydrated", "true");
  }, []);
  return (
    <RootDocument>
      <nav>
        <Link id="nav-home" to="/">home</Link>{" "}
        <Link id="nav-user" to="/users/$userId" params={{ userId: "7" }}>user 7</Link>{" "}
        <Link id="nav-loader" to="/loader-error">loader error</Link>
      </nav>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
