import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";

// Repro-only: a server function that throws, called from #btn-serverfn.
const throwServerError = createServerFn().handler(async () => {
  throw new Error("Sentry Server Function Test Error");
});

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [fetchResult, setFetchResult] = useState<string>("");
  return (
    <div>
      <h1>QS TanStack Start</h1>
      {/* manual-setup/index.mdx:582-591 verbatim (plus an id) */}
      <button
        id="btn-throw"
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Break the world
      </button>
      {/* manual-setup/index.mdx:649-669 verbatim (plus an id) */}
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
              const res = await fetch("/api/sentry-example");
              if (!res.ok) {
                throw new Error("Sentry Example Frontend Error");
              }
            }
          );
        }}
      >
        Break the world
      </button>
      <button
        id="btn-serverfn"
        type="button"
        onClick={async () => {
          await throwServerError();
        }}
      >
        Break server function
      </button>
      <button
        id="btn-fetch"
        type="button"
        onClick={async () => {
          const res = await fetch("/api/server-fetch?from=client");
          setFetchResult(await res.text());
        }}
      >
        Server-side fetch to the recorder
      </button>
      <pre id="fetch-result">{fetchResult}</pre>
    </div>
  );
}
