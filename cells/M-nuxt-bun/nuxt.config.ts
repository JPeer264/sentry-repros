export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@sentry/nuxt/module'],
  sentry: { autoInjectServerSentry: 'top-level-import', debug: true },
  sourcemap: { server: false, client: false },
  // mysql2 must stay outside the nitro bundle: rollup's CJS interop turns
  // `generate-function` into a namespace object and the driver dies with
  // "genFunc$1 is not a function" on the first query.
  nitro: { externals: { external: ['mysql2'] } },
})
