// The guide's index.jsx (index.mdx:73-133, performance option only) rendering a plain
// @solidjs/router <Router> the way the guide leaves it: `solidRouterBrowserTracingIntegration()` in
// `integrations`, but no `withSentryRouterRouting` (the guide never mentions it). Same two routes
// as the router variant, plus `tunnel`, `debug`, `window.Sentry` and the harness hooks.
import * as Sentry from "@sentry/solid";
import { solidRouterBrowserTracingIntegration } from "@sentry/solid/solidrouter";
import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { DEV } from "solid-js";
import { Home, User } from "../router/app";
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

    integrations: [solidRouterBrowserTracingIntegration()],

    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  });
}

const app = document.getElementById("root");

if (!app) throw new Error("No #root element found in the DOM.");

render(
  () => (
    <Router>
      <Route path="/router-unwrapped" component={Home} />
      <Route path="/router-unwrapped/users/:id" component={User} />
    </Router>
  ),
  app,
);
