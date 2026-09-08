import { defineNitroPlugin } from '#imports'
import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins'

export default defineNitroPlugin(
  sentryCloudflareNitroPlugin({
    dsn: 'http://public@127.0.0.1:39411/1',
    tunnel: 'http://127.0.0.1:39411/',
    tracesSampleRate: 1.0,
    // traceLifecycle: 'static',  // default is 'stream'
  }),
)
