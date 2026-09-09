// docs/platforms/javascript/guides/vue/features/component-tracking.mdx:56-69 with the missing
// comma after `trackComponents: true` added, around the same app as `component-tracking`.
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
        hooks: ["mount", "update", "unmount"],
      },
    }),
  ],
});

app.mount("#app");
