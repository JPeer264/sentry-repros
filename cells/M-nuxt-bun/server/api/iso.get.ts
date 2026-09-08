import * as Sentry from '@sentry/nuxt'

export default defineEventHandler(async event => {
  const tag = String(getQuery(event).tag ?? 'none')
  Sentry.setTag('probe_tag', tag)
  await new Promise(resolve => setTimeout(resolve, 50))
  Sentry.captureException(new Error(`iso-${tag}`))
  return { tag }
})
