// docs/platforms/javascript/guides/svelte/index.mdx:69-122 (the "Svelte v5+" tab of main.js) with
// error-monitoring, performance, session-replay and user-feedback selected. Added for this
// reproduction: `tunnel: "/tunnel"` (index.mdx:187 -> getting-started-tunneling/javascript.mdx:14-17,
// the local sink), `debug: true`, `window.Sentry` and the harness hooks for the driver.
import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

import * as Sentry from "@sentry/svelte";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__svelteVersion = __SVELTE_VERSION__;
installHarness();

// Initialize the Sentry SDK here
Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,

  integrations: [
    Sentry.browserTracingIntegration(),
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

const app = mount(App, {
  target: document.getElementById("app"),
});

export default app;
