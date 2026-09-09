// docs/platforms/javascript/guides/vue/features/component-tracking.mdx:28-48 verbatim: the
// `vueIntegration({ tracingOptions })` snippet, including its two `trackComponents` keys. The
// page says tracing must be configured (:13), so `browserTracingIntegration()`, `tracesSampleRate`
// and the `app` from the guide are added around it.
import { createApp, version } from "vue";
import * as Sentry from "@sentry/vue";
import { TrackedApp } from "../shared/tracked";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__vueVersion = version;
installHarness();

const app = createApp(TrackedApp);

Sentry.init({
  app,
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.vueIntegration({
      tracingOptions: {
        trackComponents: true,
        // OR
        trackComponents: [
          "App",
          "RwvHeader",
          "RwvFooter",
          "RwvArticleList",
          "Pagination",
        ],
      },
    }),
  ],
});

app.mount("#app");
