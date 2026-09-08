export default defineEventHandler(async () => {
  const r = await fetch('http://127.0.0.1:41119/rec')
  return { status: r.status }
})
