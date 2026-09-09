// docs/platforms/javascript/guides/vue/features/vue-router.mdx:13-43 verbatim (the page's only
// full example), built against vue@3 and vue-router@4 as installed by the guide's Vue 3 tab.
import Vue from "vue";
import App from "./App";
import * as Sentry from "@sentry/vue";
import Router from "vue-router";
import HelloWorld from "@/components/HelloWorld";
import Foo from "@/components/Foo";
import Bar from "@/components/Bar";

Vue.use(Router);

const router = new Router({
  // your router configuration
});

Sentry.init({
  Vue,
  dsn: "___PUBLIC_DSN___",
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
  ],
});

new Vue({
  el: "#app",
  router,
  components: { App },
  template: "<App/>",
});
