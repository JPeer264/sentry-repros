// getting-started-complete/javascript.nuxt.mdx:74-76 (modules). Repro-only additions: `sentry.debug`
// (the index.mdx:53-57 / cli-import.mdx:28 alert says it prints the built server config path),
// `autoInjectServerSentry` from SENTRY_AUTO_INJECT for the install/*.mdx variants, telemetry off,
// and a compatibilityDate so `nuxt build` does not warn.
export default defineNuxtConfig({
  modules: ["@sentry/nuxt/module"],
  sentry: {
    debug: true,
    ...(process.env.SENTRY_AUTO_INJECT
      ? { autoInjectServerSentry: process.env.SENTRY_AUTO_INJECT as "top-level-import" | "experimental_dynamic-import" }
      : {}),
  },
  telemetry: false,
  compatibilityDate: "2026-09-01",
});
