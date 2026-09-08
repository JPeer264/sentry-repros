import "../shared/instrument";
import App from "./App";
import { createRoot } from "react-dom/client";
import { installHarness } from "../shared/harness";
import { version } from "react";

installHarness();
window.__reactVersion = version;

createRoot(document.getElementById("app")).render(<App />);
