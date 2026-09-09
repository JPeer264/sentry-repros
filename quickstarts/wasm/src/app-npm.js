// docs/platforms/javascript/guides/wasm/index.mdx:70-100 with the error-monitoring and
// performance options selected. Added for this reproduction: `tunnel` (the local sink) and
// `debug: true`; the DSN is a placeholder, nothing leaves the machine.
import * as Sentry from "@sentry/browser";
import { wasmIntegration } from "@sentry/wasm";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/wasm/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  integrations: [
    Sentry.browserTracingIntegration(),
    wasmIntegration(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/wasm/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
});

window.Sentry = Sentry;
