import * as React from "react";
import { Link } from "gatsby";
import { markWired } from "../harness";

export default function AboutPage() {
  React.useEffect(() => {
    markWired();
  }, []);
  return (
    <main>
      <h1 id="about-title">About</h1>
      <Link id="nav-home" to="/">
        home
      </Link>
    </main>
  );
}

export const Head = () => <title>About</title>;
