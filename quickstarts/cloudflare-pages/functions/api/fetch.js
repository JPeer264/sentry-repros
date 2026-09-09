export async function onRequest() {
  const res = await fetch("http://127.0.0.1:4747/recorder?from=api-fetch");
  return Response.json(await res.json());
}
