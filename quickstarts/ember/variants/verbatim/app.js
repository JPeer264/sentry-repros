// index.mdx:60-105 copied whole-file, as the guide's "Add the following to your app/app.js file"
// reads, plus the tunneling snippet line (platform-includes/getting-started-tunneling/javascript.mdx:16),
// `debug: true`, and the harness hooks after init.
import Application from "@ember/application";
import Resolver from "ember-resolver";
import loadInitializers from "ember-load-initializers";
import config from "./config/environment";

import * as Sentry from "@sentry/ember";

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  tunnel: "/tunnel",
  debug: true,

  // ___PRODUCT_OPTION_START___ session-replay
  integrations: [
    Sentry.replayIntegration(),
    // ___PRODUCT_OPTION_START___ user-feedback
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
    // ___PRODUCT_OPTION_END___ user-feedback
  ],
  // ___PRODUCT_OPTION_END___ session-replay

  // ___PRODUCT_OPTION_START___ performance
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  // ___PRODUCT_OPTION_END___ performance
  // ___PRODUCT_OPTION_START___ session-replay

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // ___PRODUCT_OPTION_END___ session-replay
});

// harness hooks (not from the docs)
window.Sentry = Sentry;
window.__qsSentinel = (name) => {
  Sentry.captureMessage(name);
  Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
};
window.__qsMeta = () => {
  const client = Sentry.getClient();
  const options = client && client.getOptions();
  return {
    initialized: !!client,
    sdk: options && options._metadata && options._metadata.sdk,
    integrations: client ? Object.keys(client._integrations || {}) : [],
    traceLifecycle: options && options.traceLifecycle,
    tunnel: options && options.tunnel,
  };
};

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}
