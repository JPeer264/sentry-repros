export async function onRequest(context) {
  context.waitUntil(Promise.reject(new Error("waitUntil rejection")));
  return new Response("waituntil-reject");
}
