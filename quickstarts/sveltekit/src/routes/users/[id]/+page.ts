// repro-only: a universal load on the same route, runs in the browser on client-side navigation
export const load = async ({ data, params }) => {
  return { ...data, universal: params.id };
};
