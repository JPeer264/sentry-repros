export default defineEventHandler(async () => {
  const body = await $fetch(`http://127.0.0.1:${process.env.REC_PORT || '34012'}/rec-ofetch`);
  return { ok: true, body };
});
