// docs/platforms/javascript/guides/solid/index.mdx:73-133 (index.jsx) with error-monitoring,
// performance, session-replay and user-feedback selected. Added for this reproduction:
// `tunnel: "/tunnel"` (index.mdx:159 -> getting-started-tunneling/javascript.mdx:14-17, the local
// sink), `debug: true`, `window.Sentry` and the harness hooks for the driver.
import * as Sentry from "@sentry/solid";
import { solidRouterBrowserTracingIntegration } from "@sentry/solid/solidrouter";
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

    integrations: [
      solidRouterBrowserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.feedbackIntegration({
        // Additional SDK configuration goes in here, for example:
        colorScheme: "system",
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

    // Capture Replay for 10% of all sessions,
    // plus 100% of sessions with an error
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const app = document.getElementById("app");

if (!app) throw new Error("No #app element found in the DOM.");

render(() => <App />, app);
