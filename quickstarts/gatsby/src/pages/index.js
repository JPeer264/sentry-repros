// The guide's verify snippets, docs/platforms/javascript/guides/gatsby/index.mdx. Only the `id`
// attributes, the logs and fetch-probe buttons and the navigation links are added.
import * as React from "react";
import { Link } from "gatsby";
import * as Sentry from "@sentry/gatsby";
import { version } from "react";
import { markWired } from "../harness";

export default function IndexPage() {
  React.useEffect(() => {
    window.__reactVersion = version;
    markWired();
  }, []);
  return (
    <main>
      <h1>QS-gatsby</h1>
      {/* index.mdx:194-203 */}
      <button
        id="btn-throw"
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Break the world
      </button>
      {/* index.mdx:223-234 */}
      <button
        id="btn-span"
        type="button"
        onClick={() => {
          Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, () => {
            throw new Error("Sentry Test Error");
          });
        }}
      >
        Break the world
      </button>
      {/* includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-23 */}
      <button
        id="btn-log"
        type="button"
        onClick={() => {
          Sentry.logger.info("User example action completed");

          Sentry.logger.warn("Slow operation detected", {
            operation: "data_fetch",
            duration: 3500,
          });

          Sentry.logger.error("Validation failed", {
            field: "email",
            reason: "Invalid email",
          });
        }}
      >
        logs
      </button>
      {/* Propagation probe: one same-origin fetch (gatsby serve) and one to the sink's recorder. */}
      <button
        id="btn-fetch"
        type="button"
        onClick={() => {
          fetch("/page-data/about/page-data.json");
          fetch("http://localhost:4768/recorder?from=absolute");
        }}
      >
        fetch
      </button>
      <nav>
        <Link id="nav-user" to="/users/42/">
          user 42
        </Link>
        <Link id="nav-about" to="/about/">
          about
        </Link>
      </nav>
    </main>
  );
}

export const Head = () => <title>QS-gatsby</title>;
