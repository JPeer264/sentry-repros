import * as Sentry from '@sentry/nuxt'

export default defineEventHandler(() => {
  Sentry.logger.info('nuxt-bun-log-line', { where: 'handler' })
  return { logged: true }
})
