// Host page for the guide's verify snippets. The two "Break the world" buttons are
// index.mdx:187-196 and index.mdx:216-229 verbatim (only the ids are added). The boundary probe
// wraps a child that throws during render inside the include's SentryErrorBoundary; the fetch
// probe hits the sink's /recorder so it can record whether `sentry-trace` reached it; the logs
// button is the logs include verbatim.
import * as Sentry from "@sentry/solid";
import { ErrorBoundary, createSignal, onMount } from "solid-js";
import SomeComponent from "./SomeComponent";
import { markWired } from "../shared/harness";

const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary);

function boom() {
  throw new Error("Boundary Test Error");
}

export default function App() {
  const [armed, setArmed] = createSignal(false);
  onMount(markWired);
  return (
    <div>
      <h1>QS-solid base</h1>
      <SomeComponent />

      <button
        id="btn-throw"
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Break the world
      </button>

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

      <button id="btn-boundary" type="button" onClick={() => setArmed(true)}>
        arm boundary
      </button>
      <SentryErrorBoundary fallback={(err) => <div id="boundary-fallback">Error: {err.message}</div>}>
        <span id="bomb">{armed() ? boom() : "bomb idle"}</span>
      </SentryErrorBoundary>

      {/* includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24 (index.mdx:237-241) */}
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
