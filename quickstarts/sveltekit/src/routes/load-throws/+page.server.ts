// repro-only: a server load that throws
export const load = async () => {
  throw new Error("Sentry Example Load Error");
};
