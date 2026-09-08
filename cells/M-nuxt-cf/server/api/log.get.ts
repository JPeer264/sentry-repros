import * as Sentry from '@sentry/cloudflare'

export default defineEventHandler(() => {
  Sentry.logger.info('nuxt-cf-log-probe', { where: 'route-handler' })
  return { logged: true }
})
