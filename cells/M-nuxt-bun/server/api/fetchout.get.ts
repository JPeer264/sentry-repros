export default defineEventHandler(async () => {
  const res = await fetch(`http://127.0.0.1:${process.env.RECORDER_PORT ?? 34119}/rec`)
  return { status: res.status }
})
