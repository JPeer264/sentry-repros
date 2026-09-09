// docs/platforms/javascript/guides/vue/index.mdx:238-245 ("Configuration for Pinia"), identical
// to features/pinia.mdx:8-15, on the guide's main.js (error monitoring only). The store, its
// actions and the capture button stand in for an app.
import { createApp, version } from "vue";
import { createPinia, defineStore } from "pinia";
import { createSentryPiniaPlugin } from "@sentry/vue";
import * as Sentry from "@sentry/vue";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__vueVersion = version;
installHarness();

const pinia = createPinia();

pinia.use(createSentryPiniaPlugin());

const useCounter = defineStore("counter", {
  state: () => ({ count: 0, password: "", secret: "" }),
  actions: {
    increment() {
      this.count++;
    },
    setPassword(password) {
      this.password = password;
    },
    governmentSecrets(secret) {
      this.secret = secret;
    },
  },
});

const app = createApp({
  name: "App",
  mounted() {
    document.body.setAttribute("data-wired", "1");
  },
  template: `<div>
    <button id="btn-dispatch" @click="dispatch">dispatch</button>
    <button id="btn-capture" @click="capture">capture</button>
    <span id="count">{{ store.count }}</span>
  </div>`,
  setup() {
    const store = useCounter();
    window.__store = store;
    return {
      store,
      dispatch() {
        store.increment();
        store.increment();
        store.setPassword("hunter2");
        store.governmentSecrets("area51");
      },
      capture() {
        Sentry.captureException(new Error("Error with pinia state"));
      },
    };
  },
});

Sentry.init({
  app,
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
});

app.use(pinia);
app.mount("#app");
