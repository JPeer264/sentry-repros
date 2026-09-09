// docs/platforms/javascript/guides/vue/index.mdx:203-219 ("Configuration for Late-Defined Vue
// Apps") verbatim. The snippet imports only Sentry, so `createApp` is imported here; the
// template gets a throw button next to "hello" so the late-attached error handler can be exercised.
import { createApp, version } from "vue";
import * as Sentry from "@sentry/vue";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__vueVersion = version;
installHarness();

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  // Filter out default `Vue` integration
  integrations: (integrations) =>
    integrations.filter((integration) => integration.name !== "Vue"),
});

window.__integrationsBeforeAdd = Object.keys(Sentry.getClient()._integrations || {});

// Sometimes later
const app = createApp({
  template: "<div>hello <button id='btn-throw' @click='boom'>boom</button></div>",
  methods: {
    boom() {
      throw new Error("late-init error");
    },
  },
  mounted() {
    document.body.setAttribute("data-wired", "1");
  },
});

Sentry.addIntegration(Sentry.vueIntegration({ app }));

app.mount("#app");
