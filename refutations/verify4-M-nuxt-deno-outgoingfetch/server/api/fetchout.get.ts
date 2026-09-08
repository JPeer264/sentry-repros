export default defineEventHandler(async () => {
  const res = await fetch(`http://127.0.0.1:${process.env.REC_PORT || '34012'}/rec-globalfetch`);
  return { ok: res.ok, body: await res.text() };
});
