// The same App as error-boundary/, rendered with a plain `createRoot` and no `reactErrorHandler`
// hooks: what the React 18 path of error-boundary.mdx:25 ("ErrorBoundary is your primary tool")
// looks like, and the control run for the React 19 double-capture check.
import "../shared/instrument";
import { createRoot } from "react-dom/client";
import App from "../error-boundary/App";
import { installHarness } from "../shared/harness";
import { version } from "react";

installHarness();
window.__reactVersion = version;

createRoot(document.getElementById("root")).render(<App />);
