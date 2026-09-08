import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import { markWired } from "./harness";

// The guide's verify snippets, docs/platforms/javascript/guides/react/index.mdx. Only the `id`
// attributes and the wrapping buttons for logs and the fetch probe are added.
export function VerifyButtons() {
  useEffect(() => {
    markWired();
  }, []);
  return (
    <div>
      {/* index.mdx:361-370 */}
      <button
        id="btn-throw"
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Break the world
      </button>
      {/* index.mdx:376-389 */}
      <button
        id="btn-span"
        type="button"
        onClick={() => {
          Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, () => {
            setTimeout(() => {
              throw new Error("Sentry Test Error");
            }, 99);
          });
        }}
      >
        Break the world
      </button>
      {/* index.mdx:397-401 */}
      <button
        id="btn-log"
        type="button"
        onClick={() => {
          Sentry.logger.info("User action", { userId: "123" });
          Sentry.logger.warn("Slow response", { duration: 5000 });
          Sentry.logger.error("Operation failed", { reason: "timeout" });
        }}
      >
        logs
      </button>
      {/* Propagation probe for tracePropagationTargets: [/^\//, ...] (index.mdx:105) */}
      <button
        id="btn-fetch"
        type="button"
        onClick={() => {
          fetch("/recorder?from=relative");
          fetch(window.location.origin + "/recorder?from=absolute");
        }}
      >
        fetch
      </button>
    </div>
  );
}
