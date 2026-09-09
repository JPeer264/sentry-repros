// repro-only: a server load on a parameterized route (auto-instrumented by the Vite plugin per
// configuration/build/index.mdx:69-71, and traced by Kit per the svelte.config tracing option)
export const load = async ({ params }) => {
  return { id: params.id, from: "server-load" };
};
