// platform-includes/getting-started-capture-errors/javascript.solid.mdx:1-15 verbatim
// (rendered by index.mdx:147 "Capture Solid Errors" and by features/error-boundary.mdx:11).
import * as Sentry from "@sentry/solid";
import { ErrorBoundary } from "solid-js";

// Wrap Solid's ErrorBoundary to automatically capture exceptions
const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary);

export default function SomeComponent() {
  return (
    <SentryErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
      <div>Some Component</div>
    </SentryErrorBoundary>
  );
}
