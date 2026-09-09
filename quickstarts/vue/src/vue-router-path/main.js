// docs/platforms/javascript/guides/vue/features/vue-router.mdx:49-54 (the `routeLabel: "path"`
// configuration) on the guide's Vue 3 main.js (index.mdx:71-126, performance only).
import { createApp, version } from "vue";
import { createRouter } from "vue-router";
import * as Sentry from "@sentry/vue";
import { routerOptions, RootApp } from "../shared/routes";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__vueVersion = version;
installHarness();

const app = createApp({ ...RootApp });
const router = createRouter({ ...routerOptions });

Sentry.init({
  app,
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  integrations: [
    Sentry.browserTracingIntegration({
      router,
      routeLabel: "path",
    }),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
});

app.use(router);
app.mount("#app");
