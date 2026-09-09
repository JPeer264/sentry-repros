// docs/platforms/javascript/guides/vue/features/multiple-apps.mdx:13-21 (`app: [appOne, appTwo,
// appThree]`, written with `Vue.createApp` as printed) and :27-33 (the lazy app with
// `createTracingMixins` and `attachErrorHandler`). The page shows no imports, dsn or App; those
// and the throw buttons are added.
import * as Vue from "vue";
import { createApp, version } from "vue";
import * as Sentry from "@sentry/vue";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__vueVersion = version;
installHarness();

const Child = { name: "LazyChild", template: `<span class="lazy-child">child</span>` };
const App = {
  name: "App",
  components: { Child },
  props: ["label"],
  template: `<div><button :id="'throw-' + label" @click="boom">throw {{ label }}</button><Child /></div>`,
  methods: {
    boom() {
      throw new Error("Error from app " + this.label);
    },
  },
};
const MiscApp = { ...App, name: "MiscApp" };

const appOne = Vue.createApp(App, { label: "one" });
const appTwo = Vue.createApp(App, { label: "two" });
const appThree = Vue.createApp(App, { label: "three" });

Sentry.init({
  app: [appOne, appTwo, appThree],
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  tracesSampleRate: 1.0,
  integrations: [Sentry.browserTracingIntegration()],
});

appOne.mount("#app-one");
appTwo.mount("#app-two");
appThree.mount("#app-three");

// ...
const myLazyApp = createApp(MiscApp, { label: "lazy" });

myLazyApp.mixin(Sentry.createTracingMixins({ trackComponents: true }));
Sentry.attachErrorHandler(myLazyApp);

myLazyApp.mount("#app-lazy");
document.body.setAttribute("data-wired", "1");
