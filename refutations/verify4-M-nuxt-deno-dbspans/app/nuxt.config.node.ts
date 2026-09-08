export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: ['@sentry/nuxt/module'],
  sentry: { autoInjectServerSentry: 'top-level-import', sourceMapsUploadOptions: { enabled: false } },
  sourcemap: { server: false, client: false },
  nitro: {
    preset: 'node-server',
    externals: { inline: ['generate-function', 'named-placeholders'] },
  },
});
