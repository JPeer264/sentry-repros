// docs/platforms/javascript/guides/vue/index.mdx:71-126 (the "Vue 3" tab of main.js) with
// error-monitoring, performance, session-replay and user-feedback selected. Added for this
// reproduction: `tunnel: "/tunnel"` (index.mdx:257 -> getting-started-tunneling/javascript.mdx:14-17,
// the local sink), `debug: true`, `window.Sentry` for the driver, and the routes/root component
// that stand in for the snippet's `// ...`.
import { createApp, version } from "vue";
import { createRouter } from "vue-router";
import * as Sentry from "@sentry/vue";
import { routerOptions, RootApp } from "../shared/routes";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__vueVersion = version;
installHarness();

const app = createApp({
  // ...
  ...RootApp,
});
const router = createRouter({
  // ...
  ...routerOptions,
});

Sentry.init({
  app,
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,

  integrations: [
    Sentry.browserTracingIntegration({ router }),
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
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

app.use(router);
app.mount("#app");
