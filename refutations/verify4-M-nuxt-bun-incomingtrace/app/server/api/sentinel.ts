import * as Sentry from '@sentry/core'
export default defineEventHandler(async () => {
  Sentry.captureMessage('sentinel')
  await Sentry.flush(2000)
  return { ok: true }
})
