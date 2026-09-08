// docs/platforms/javascript/guides/react/features/error-boundary.mdx:27-39.
import "../shared/instrument";
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installHarness } from "../shared/harness";
import { version } from "react";

installHarness();
window.__reactVersion = version;

const root = createRoot(document.getElementById("root"), {
  // Error reporting: captures all errors
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(<App />);
