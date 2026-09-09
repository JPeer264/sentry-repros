// features/error-boundary.mdx:11 renders getting-started-capture-errors/javascript.solid.mdx:1-15
// (src/base/SomeComponent.jsx, verbatim). The page shows no init of its own, so this variant uses
// the guide's index.jsx (index.mdx:73-133) with error-monitoring only, plus `tunnel`, `debug`,
// `window.Sentry` and the harness hooks for the driver.
import * as Sentry from "@sentry/solid";
import { render } from "solid-js/web";
import { DEV } from "solid-js";
import App from "./app";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__solidVersion = __SOLID_VERSION__;
window.__routerVersion = __ROUTER_VERSION__;
window.__solidDev = DEV;
installHarness();

// this will only initialize your Sentry client in production builds.
if (!DEV) {
  Sentry.init({
    dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
    tunnel: "/tunnel",
    debug: true,
  });
}

const app = document.getElementById("app");

if (!app) throw new Error("No #app element found in the DOM.");

render(() => <App />, app);
