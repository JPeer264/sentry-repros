// docs/platforms/javascript/guides/react/index.mdx:156-174 ("Capture React Errors (React 19+)").
import "../shared/instrument";
import App from "./App";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { installHarness } from "../shared/harness";
import { version } from "react";

installHarness();
window.__reactVersion = version;

const container = document.getElementById("app");
const root = createRoot(container, {
  // Callback called when an error is thrown and not caught by an ErrorBoundary.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("Uncaught error", error, errorInfo.componentStack);
  }),
  // Callback called when React catches an error in an ErrorBoundary.
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
});
root.render(<App />);
