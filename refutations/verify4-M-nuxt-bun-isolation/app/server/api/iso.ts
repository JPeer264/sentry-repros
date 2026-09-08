import * as Sentry from '@sentry/nuxt'

export default defineEventHandler(async event => {
  const tag = getQuery(event).tag as string
  Sentry.setTag('probe_tag', tag)
  await new Promise(r => setTimeout(r, 50 + Math.random() * 250))
  Sentry.captureException(new Error(`iso-${tag}`))
  return { tag }
})
