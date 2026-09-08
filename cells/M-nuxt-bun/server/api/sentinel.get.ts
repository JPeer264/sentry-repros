import * as Sentry from '@sentry/nuxt'

export default defineEventHandler(() => {
  Sentry.captureMessage('sentinel')
  return { sentinel: true }
})
