export default defineEventHandler(async () => {
  const res = await fetch('http://127.0.0.1:39411/__record?from=nuxt')
  return { status: res.status }
})
