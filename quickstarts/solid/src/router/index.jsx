// docs/platforms/javascript/guides/solid/features/solid-router.mdx:20-45 verbatim, except: the
// page's `<Route path="/" component={App} /> ...` placeholder is replaced by a home route and a
// parameterized route under /router (the sink serves this page for /router/*), plus `tunnel`,
// `debug`, `window.Sentry` and the harness hooks for the driver.
import * as Sentry from "@sentry/solid";
import { solidRouterBrowserTracingIntegration, withSentryRouterRouting } from '@sentry/solid/solidrouter';
import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { Home, User } from "./app";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__solidVersion = __SOLID_VERSION__;
window.__routerVersion = __ROUTER_VERSION__;
installHarness();

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  integrations: [solidRouterBrowserTracingIntegration()],
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});

// Wrap Solid Router to collect meaningful performance data on route changes
const SentryRouter = withSentryRouterRouting(Router);

render(
  () => (
    <SentryRouter>
      <Route path="/router" component={Home} />
      <Route path="/router/users/:id" component={User} />
    </SentryRouter>
  ),
  document.getElementById("root"),
);
