export async function onRequest(context) {
  return Response.json({ id: context.params.id, name: "Ada" });
}
