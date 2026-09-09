// Server-side request to the sink's recorder, which stores the propagation headers it receives.
export default defineEventHandler(async (event) => {
  const via = getQuery(event).via === "fetch" ? "fetch" : "$fetch";
  const url = `http://localhost:4752/recorder?from=server-${via}`;
  const body = via === "fetch" ? await (await fetch(url)).json() : await $fetch(url);
  return { via, body };
});
