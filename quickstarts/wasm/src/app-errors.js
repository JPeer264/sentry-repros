// docs/platforms/javascript/guides/wasm/index.mdx:70-100 with only the error-monitoring option
// selected (every ___PRODUCT_OPTION___ performance block removed). Added for this reproduction:
// `tunnel` (the local sink) and `debug: true`; the DSN is a placeholder, nothing leaves the machine.
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
    wasmIntegration(),
  ],
});

window.Sentry = Sentry;
