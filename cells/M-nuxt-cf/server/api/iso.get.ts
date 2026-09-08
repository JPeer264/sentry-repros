import * as Sentry from '@sentry/cloudflare'

export default defineEventHandler(async event => {
  const tag = String(getQuery(event).tag ?? 'none')
  Sentry.setTag('probe-tag', tag)
  await new Promise(resolve => setTimeout(resolve, 150))
  Sentry.captureException(new Error(`iso-error-${tag}`))
  return { tag }
})
