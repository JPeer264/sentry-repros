// Probes around the include's `Sentry.withSentryErrorBoundary(ErrorBoundary)` (SomeComponent.jsx is
// the include verbatim). Bomb throws during render when armed; the handler button throws from an
// onClick inside the boundary subtree; the async button throws from a setTimeout inside it.
import * as Sentry from "@sentry/solid";
import { ErrorBoundary, createSignal, onMount } from "solid-js";
import SomeComponent from "../base/SomeComponent";
import { markWired } from "../shared/harness";

const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary);

function boom(message) {
  throw new Error(message);
}

export default function App() {
  const [armed, setArmed] = createSignal(false);
  onMount(markWired);
  return (
    <div>
      <h1>QS-solid error-boundary</h1>
      <SomeComponent />

      <button id="btn-render-throw" type="button" onClick={() => setArmed(true)}>
        throw during render
      </button>
      <SentryErrorBoundary
        fallback={(err, reset) => (
          <div>
            <div id="boundary-fallback">Error: {err.message}</div>
            <button id="btn-reset" type="button" onClick={() => { setArmed(false); reset(); }}>
              reset
            </button>
          </div>
        )}
      >
        <span id="bomb">{armed() ? boom("Boundary Render Error") : "bomb idle"}</span>
        <button id="btn-handler-throw" type="button" onClick={() => boom("Boundary Handler Error")}>
          throw in handler
        </button>
        <button id="btn-async-throw" type="button" onClick={() => setTimeout(() => boom("Boundary Async Error"), 10)}>
          throw async
        </button>
      </SentryErrorBoundary>
    </div>
  );
}
