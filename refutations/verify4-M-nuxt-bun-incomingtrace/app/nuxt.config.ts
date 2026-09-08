export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@sentry/nuxt/module'],
  sentry: { autoInjectServerSentry: 'top-level-import', debug: true },
  sourcemap: { server: false, client: false },
})
