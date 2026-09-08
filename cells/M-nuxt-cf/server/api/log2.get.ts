import * as Sentry from '@sentry/nuxt'

export default defineEventHandler(() => {
  Sentry.logger.info('nuxt-import-log-probe', { where: 'route-handler' })
  return { logged: true }
})
