export default defineEventHandler(async () => {
  const port = process.env.RECORDER_PORT ?? 41712;
  const res = await fetch(`http://127.0.0.1:${port}/rec`);
  return { rec: await res.json() };
});
