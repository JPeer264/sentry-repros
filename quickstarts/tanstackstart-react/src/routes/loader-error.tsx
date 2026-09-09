import { createFileRoute } from "@tanstack/react-router";

// Repro-only: a route loader that throws, on the server during SSR and on the client during navigation.
export const Route = createFileRoute("/loader-error")({
  loader: () => {
    throw new Error("Sentry Loader Test Error");
  },
  component: () => <p>never rendered</p>,
  errorComponent: ({ error }) => <p id="loader-error-boundary">loader error: {error.message}</p>,
});
