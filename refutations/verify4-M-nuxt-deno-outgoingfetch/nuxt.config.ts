export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: ['@sentry/nuxt/module'],
  sentry: { autoInjectServerSentry: 'top-level-import', sourceMapsUploadOptions: { enabled: false } },
  nitro: { preset: 'deno_server' },
});
