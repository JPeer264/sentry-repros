// docs/platforms/javascript/guides/vue/features/component-tracking.mdx:56-69 verbatim (the
// `hooks` snippet), build only.
import * as Sentry from "@sentry/vue";

Sentry.init({
  integrations: [
    Sentry.vueIntegration({
      tracingOptions: {
        trackComponents: true
        hooks: ["mount", "update", "unmount"],
      },
    }),
  ],
});
