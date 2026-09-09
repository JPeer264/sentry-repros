// File System Route API client-only route: Gatsby registers it with `matchPath: "/users/:id"`
// (public/match-paths.json) and hands the segment in as `params.id`.
import * as React from "react";
import { Link } from "gatsby";
import { markWired } from "../../harness";

export default function UserPage({ params }) {
  React.useEffect(() => {
    markWired();
  }, []);
  return (
    <main>
      <h1>
        User <span id="user-id">{params.id}</span>
      </h1>
      <Link id="nav-home" to="/">
        home
      </Link>
    </main>
  );
}

export const Head = () => <title>User</title>;
