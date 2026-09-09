// The verify page. #btn-throw is docs getting-started-complete/javascript.remix.mdx:443-452 verbatim,
// #btn-span is :473-493 verbatim (the "Tracing" version of the button). The rest is repro-only:
// #btn-fetch probes the recorder on the sink so it can record whether `sentry-trace` was attached,
// the links drive client-side navigations to a parameterized route and to a throwing loader.
import { Link } from "@remix-run/react";
import * as Sentry from "@sentry/remix";

export default function Index() {
  return (
    <main>
      <h1 id="verify-page">Remix verify page</h1>
      <button
        id="btn-throw"
        type="button"
        onClick={() => {
          throw new Error("Sentry Example Frontend Error");
        }}
      >
        <span>Throw Sample Error</span>
      </button>
      <button
        id="btn-span"
        type="button"
        onClick={async () => {
          await Sentry.startSpan(
            {
              name: "Example Frontend Span",
              op: "test",
            },
            async () => {
              const res = await fetch("/api/sentry-example-api");
              if (!res.ok) {
                throw new Error("Sentry Example Frontend Error");
              }
            }
          );
        }}
      >
        <span>Throw Sample Error</span>
      </button>
      <button
        id="btn-fetch"
        type="button"
        onClick={() => {
          fetch("http://localhost:4758/recorder?from=client");
        }}
      >
        Fetch recorder
      </button>
      <nav>
        <Link id="nav-user" to="/users/7">
          user 7
        </Link>
        <Link id="nav-loader-throw" to="/loader-throws">
          loader throws
        </Link>
        <Link id="nav-action" to="/action-throws">
          action page
        </Link>
      </nav>
    </main>
  );
}
