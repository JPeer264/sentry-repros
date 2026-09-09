import { createFileRoute } from "@tanstack/react-router";

// Repro-only: a server route that fetches the sink's recorder so outgoing `sentry-trace` is observable,
// and echoes the incoming trace headers so the driver sees whether the browser's headers reached the server.
export const Route = createFileRoute("/api/server-fetch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const from = new URL(request.url).searchParams.get("from") ?? "unknown";
        const res = await fetch(`http://localhost:4762/recorder?from=server-for-${from}`);
        await res.text();
        return new Response(
          JSON.stringify({
            incoming: {
              "sentry-trace": request.headers.get("sentry-trace"),
              baggage: request.headers.get("baggage"),
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
